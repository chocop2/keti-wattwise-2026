# -*- coding: utf-8 -*-
"""자취방 1인가구 전력 합성 + 오토인코더 이상탐지 PoC"""
import os, json, argparse
import numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.rcParams["font.family"] = "Malgun Gothic"; plt.rcParams["axes.unicode_minus"] = False
import torch, torch.nn as nn
from sklearn.metrics import f1_score, precision_score, recall_score

rng = np.random.default_rng(42); torch.manual_seed(42)
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("WATTWISE_ANOMALY_OUT", os.path.join(ROOT, "anomaly_output"))
CHECKPOINT = os.environ.get("WATTWISE_ANOMALY_CHECKPOINT", os.path.join(OUT, "anomaly_checkpoint.pt"))
PLOT = os.path.join(OUT, "plots"); os.makedirs(PLOT, exist_ok=True)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--force-train", action="store_true", help="기존 체크포인트를 무시하고 다시 학습")
args = parser.parse_args()
P = 96  # 15분 × 96 = 하루
t = np.arange(P); hour = t / 4.0

# ── 1) 합성 정상 일 프로파일 (kW) ──
def normal_day(weekend=False):
    load = np.full(P, 0.0)
    # 냉장고: 상시 사이클링
    fridge = 0.06 + 0.05 * (np.sin(2*np.pi*hour/1.5 + rng.uniform(0,6)) > 0.3)
    load += fridge + rng.normal(0, 0.006, P)
    # 대기전력
    load += 0.03
    def bump(c, w, a):  # 가우시안 활동 봉우리
        return a * np.exp(-0.5*((hour-c)/w)**2)
    # 아침(기상): 전기포트·조명·충전
    load += bump(7.5+rng.normal(0,0.4), 0.8, rng.uniform(0.5,1.0))
    # 저녁(귀가~취침): TV·조명·조리
    load += bump(19.5+rng.normal(0,0.5), 1.4, rng.uniform(0.5,0.9))
    # 조리 스파이크 2~3회
    for _ in range(rng.integers(2,4)):
        load += bump(rng.uniform(18,21.5), 0.18, rng.uniform(0.4,0.9))
    if weekend:  # 주말 낮 활동 ↑
        load += bump(14+rng.normal(0,1), 2.2, rng.uniform(0.25,0.5))
    else:        # 평일 낮 외출(저부하)
        pass
    load = np.clip(load, 0.02, None) * rng.uniform(0.9,1.1)  # 일 변동
    return load

def make_days(n, start_wd=0):
    return np.array([normal_day(weekend=((start_wd+i)%7 in (5,6))) for i in range(n)])

# ── 2) 이상 주입 ──
def inject(day, kind):
    d = day.copy()
    if kind == "TV·조명 상시 ON":         # 야간에도 안 꺼짐
        night = (hour < 6) | (hour > 23)
        d[night] += rng.uniform(0.30,0.45)
    elif kind == "취사 부하 소실":         # 저녁 조리·활동 사라짐
        ev = (hour > 17) & (hour < 23)
        base = 0.06 + 0.03
        d[ev] = base + rng.normal(0,0.01, ev.sum())
    elif kind == "냉장고만·활동정지":       # 고독사형: 활동 전무, 냉장고 base만
        base = 0.06 + 0.03
        d[:] = base + rng.normal(0,0.008, P)
    elif kind == "야간 활동 소실":         # 밤 이상 정적(이미 낮음이나 더 평탄)
        d[:] = np.minimum(d, 0.10) + rng.normal(0,0.006, P)
    return np.clip(d, 0.02, None)

# ── 3) 데이터셋 구성 ──
train = make_days(50, 0)                         # 정상 50일 학습
val = make_days(20, 50)                          # 정상 20일 (임계 보정용)
normal_test = make_days(20, 70)                  # 정상 20일 (FPR 평가용)
# 활동정지 5일 연속(리드타임 측정) + 다른 이상 각 3일
epi = np.array([inject(normal_day(), "냉장고만·활동정지") for _ in range(5)])
others = {k: np.array([inject(normal_day(), k) for _ in range(3)])
          for k in ["TV·조명 상시 ON","취사 부하 소실","야간 활동 소실"]}
anom_all = np.vstack([epi] + [others[k] for k in others])
anom_labels = ["냉장고만·활동정지"]*5 + sum([[k]*3 for k in others], [])

# CSV 저장(자취방 실측처럼)
idx = pd.date_range("2026-06-01", periods=(len(train)+len(normal_test))*P, freq="15min")
allnorm = np.vstack([train, normal_test]).reshape(-1)
pd.DataFrame({"timestamp": idx, "power_kW": np.round(allnorm,4)}).to_csv(
    os.path.join(OUT,"자취방_전력_합성.csv"), index=False, encoding="utf-8-sig")

# ── 4) 오토인코더 ──
mu, sd = train.mean(0), train.std(0)+1e-6
def norm(x): return (x-mu)/sd
class AE(nn.Module):
    def __init__(s):
        super().__init__()
        s.enc = nn.Sequential(nn.Linear(P,48), nn.ReLU(), nn.Linear(48,16), nn.ReLU(), nn.Linear(16,4))
        s.dec = nn.Sequential(nn.Linear(4,16), nn.ReLU(), nn.Linear(16,48), nn.ReLU(), nn.Linear(48,P))
    def forward(s,x): return s.dec(s.enc(x))
ae = AE(); opt = torch.optim.Adam(ae.parameters(), lr=1e-3, weight_decay=1e-4); lossf = nn.MSELoss()
Xtr = torch.tensor(norm(train), dtype=torch.float32)
checkpoint_loaded = False
if os.path.exists(CHECKPOINT) and not args.force_train:
    checkpoint = torch.load(CHECKPOINT, map_location="cpu", weights_only=False)
    if checkpoint.get("input_points") != P:
        raise ValueError(f"체크포인트 입력 길이({checkpoint.get('input_points')})가 현재 설정({P})과 다릅니다.")
    ae.load_state_dict(checkpoint["model_state"])
    mu = np.asarray(checkpoint["mu"], dtype=np.float64)
    sd = np.asarray(checkpoint["sd"], dtype=np.float64)
    checkpoint_loaded = True
else:
    for ep in range(300):
        opt.zero_grad()
        noisy = Xtr + torch.randn_like(Xtr)*0.12   # denoising AE — 일반화 ↑
        out = ae(noisy); loss = lossf(out, Xtr); loss.backward(); opt.step()

def recon_err(days):
    X = torch.tensor(norm(days), dtype=torch.float32)
    with torch.no_grad(): R = ae(X).numpy()
    return ((norm(days)-R)**2).mean(1), R

err_val,_ = recon_err(val)
err_nt,_ = recon_err(normal_test)
err_an, R_an = recon_err(anom_all)
if checkpoint_loaded:
    thr = float(checkpoint["threshold"])
else:
    thr = float(np.percentile(err_val, 97))  # 임계값 = 검증(정상) 오차 97분위 → 일반화
    os.makedirs(os.path.dirname(CHECKPOINT), exist_ok=True)
    torch.save({
        "model_state": ae.state_dict(),
        "mu": mu.tolist(),
        "sd": sd.tolist(),
        "threshold": thr,
        "input_points": P,
        "model_type": "denoising_autoencoder",
        "model_version": "exp-poc-v1",
        "seed": 42,
        "train_days": len(train),
    }, CHECKPOINT)

# ── 5) 지표 ──
y_true = np.r_[np.zeros(len(normal_test)), np.ones(len(anom_all))]
y_pred = np.r_[err_nt, err_an] > thr
F1 = f1_score(y_true, y_pred); PR = precision_score(y_true, y_pred); RC = recall_score(y_true, y_pred)
FPR = (err_nt > thr).mean()
# 리드타임: 활동정지 5일 에피소드 중 몇째 날 첫 탐지
epi_flag = err_an[:5] > thr
lead = int(np.argmax(epi_flag))+1 if epi_flag.any() else -1
metrics = {"F1": round(F1,3), "precision": round(PR,3), "recall": round(RC,3),
           "FPR": round(float(FPR),3), "threshold": round(float(thr),4),
           "lead_days": lead, "n_train": len(train), "n_normal_test": len(normal_test),
           "n_anomaly": len(anom_all)}
json.dump(metrics, open(os.path.join(OUT,"metrics.json"),"w",encoding="utf-8"), ensure_ascii=False, indent=2)
metrics["checkpoint"] = CHECKPOINT
metrics["checkpoint_loaded"] = checkpoint_loaded
print("METRICS", metrics)

# ── 6) 그래프 ──
TEAL="#0A9AA8"; AMBER="#E39A00"; RED="#D8432B"; INK="#1F2328"; GRAY="#9aa0a6"
# (A) 정상 vs 이상 재구성 비교
fig,ax=plt.subplots(1,2,figsize=(11,3.6))
_,Rn = recon_err(normal_test[:1])
ax[0].plot(hour, normal_test[0], color=INK, lw=2, label="실측")
ax[0].plot(hour, (Rn[0]*sd+mu), color=TEAL, lw=2, ls="--", label="AE 복원")
ax[0].set_title("정상 하루 — 복원 잘 맞음 (오차 낮음)"); ax[0].legend(fontsize=9)
ai = 2  # 활동정지 예시
ax[1].plot(hour, anom_all[ai], color=INK, lw=2, label="실측(이상)")
ax[1].plot(hour, (R_an[ai]*sd+mu), color=AMBER, lw=2, ls="--", label="AE 복원")
ax[1].fill_between(hour, anom_all[ai], (R_an[ai]*sd+mu), color=RED, alpha=0.12)
ax[1].set_title("이상(냉장고만·활동정지) — 복원 크게 어긋남 (오차↑)"); ax[1].legend(fontsize=9)
for a in ax: a.set_xlabel("시각(시)"); a.set_ylabel("전력 (kW)"); a.set_xlim(0,24); a.grid(alpha=.25)
plt.tight_layout(); plt.savefig(os.path.join(PLOT,"recon_compare.png"), dpi=130); plt.close()

# (B) 재구성오차 타임라인 + 임계
fig,ax=plt.subplots(figsize=(11,3.4))
seq = np.r_[err_nt, err_an]
xs = np.arange(len(seq))
colors = [TEAL]*len(err_nt) + [RED if l=="냉장고만·활동정지" else AMBER for l in anom_labels]
ax.bar(xs, seq, color=colors, width=0.8, zorder=3)
ax.set_yscale("log"); ax.set_ylim(0.1, max(seq)*1.8)
ax.axhline(thr, color=INK, ls="--", lw=1.5, zorder=4, label=f"임계값 (정상 97분위 = {thr:.2f})")
ax.axvspan(len(err_nt)-0.5, len(err_nt)+4.5, color=RED, alpha=0.07, zorder=0)
ax.text(len(err_nt)+2, max(seq)*0.9, "활동정지 5일", color=RED, fontsize=9, ha="center")
ax.set_xlabel(f"날짜 (정상 {len(err_nt)}일 → 이상 {len(err_an)}일)"); ax.set_ylabel("재구성 오차 (로그)")
ax.set_title("재구성 오차 = 이상 점수 : 정상은 낮고 이상은 임계 초과"); ax.legend(fontsize=9); ax.grid(alpha=.2, axis="y", zorder=0)
plt.tight_layout(); plt.savefig(os.path.join(PLOT,"error_timeline.png"), dpi=130); plt.close()

# (C) 오차 분포
fig,ax=plt.subplots(figsize=(7,3.2))
ax.hist(err_nt, bins=12, color=TEAL, alpha=.7, label="정상")
ax.hist(err_an, bins=12, color=RED, alpha=.6, label="이상")
ax.axvline(thr, color=INK, ls="--", lw=1.5, label="임계값")
ax.set_xlabel("재구성 오차"); ax.set_ylabel("일수"); ax.set_title("오차 분포 — 정상 vs 이상 분리"); ax.legend(fontsize=9)
plt.tight_layout(); plt.savefig(os.path.join(PLOT,"error_dist.png"), dpi=130); plt.close()
print("SAVED plots to", PLOT)
