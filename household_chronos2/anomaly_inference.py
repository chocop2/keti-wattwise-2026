"""Score one synthetic exp.py anomaly scenario with the saved autoencoder."""
import argparse, json, os
import numpy as np
import torch
import torch.nn as nn

P = 96
class AE(nn.Module):
    def __init__(self):
        super().__init__(); self.enc=nn.Sequential(nn.Linear(P,48),nn.ReLU(),nn.Linear(48,16),nn.ReLU(),nn.Linear(16,4)); self.dec=nn.Sequential(nn.Linear(4,16),nn.ReLU(),nn.Linear(16,48),nn.ReLU(),nn.Linear(48,P))
    def forward(self, x): return self.dec(self.enc(x))

def normal_day(rng, weekend=False):
    hour=np.arange(P)/4; load=np.full(P,0.0); load += 0.06+0.05*(np.sin(2*np.pi*hour/1.5+rng.uniform(0,6))>0.3); load += rng.normal(0,0.006,P)+0.03
    bump=lambda c,w,a:a*np.exp(-0.5*((hour-c)/w)**2)
    load += bump(7.5+rng.normal(0,0.4),0.8,rng.uniform(0.5,1.0))+bump(19.5+rng.normal(0,0.5),1.4,rng.uniform(0.5,0.9))
    for _ in range(rng.integers(2,4)): load += bump(rng.uniform(18,21.5),0.18,rng.uniform(0.4,0.9))
    if weekend: load += bump(14+rng.normal(0,1),2.2,rng.uniform(0.25,0.5))
    return np.clip(load,0.02,None)*rng.uniform(0.9,1.1)

def main():
    parser=argparse.ArgumentParser(); parser.add_argument("--scenario", choices=["normal","always_on","cooking_loss","inactive","night_loss","away"], default="normal"); parser.add_argument("--checkpoint", default=os.path.join(os.path.dirname(__file__),"..","anomaly_output","anomaly_checkpoint.pt")); args=parser.parse_args()
    ckpt=torch.load(args.checkpoint,map_location="cpu",weights_only=False); model=AE(); model.load_state_dict(ckpt["model_state"]); model.eval(); mu=np.asarray(ckpt["mu"]); sd=np.asarray(ckpt["sd"]); rng=np.random.default_rng(4242); day=normal_day(rng)
    if args.scenario in ("always_on", "night_loss"): day[(np.arange(P)/4<6)|(np.arange(P)/4>23)] += 0.35 if args.scenario=="always_on" else -0.0
    if args.scenario=="cooking_loss": day[(np.arange(P)/4>17)&(np.arange(P)/4<23)] = 0.09
    if args.scenario=="inactive": day[:] = 0.09 + rng.normal(0,0.008,P)
    if args.scenario=="night_loss": day[(np.arange(P)/4<6)|(np.arange(P)/4>23)] = 0.09
    # 외출은 exp.py의 이상 주입 유형이 아니므로 정상 패턴을 유지하고 예외로 표시한다.
    with torch.no_grad(): recon=model(torch.tensor((day-mu)/sd,dtype=torch.float32)).numpy()
    score=float(np.mean(((day-mu)/sd-recon)**2)); threshold=float(ckpt["threshold"])
    print(json.dumps({"scenario":args.scenario,"score":score,"threshold":threshold,"isAnomaly":score>threshold},ensure_ascii=False))
if __name__=="__main__": main()
