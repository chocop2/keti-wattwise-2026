# 가구 전체 사용량: Chronos-2 + 달력 공변량

이 폴더 전체를 복사하면 원본 프로젝트 없이 실행할 수 있습니다.
가중치는 amazon/chronos-2 사전학습 모델을 로컬 캐시에서 불러와
save_pretrained로 저장했습니다. 추가 학습/fine-tuning은 하지 않았습니다.
달력 변수는 추론할 때 생성되며 별도로 학습된 가중치가 아닙니다.

## 구성

- checkpoint/config.json: 모델 구조와 설정
- checkpoint/model.safetensors: 가중치, 약 456 MiB (.pt 대신 사용)
- run_chronos2_covariates.py: 원본 평가 코드의 독립 실행용 복사본
- inference.py: 최신 관측 이후 24시간 예측
- data/hourly_base.parquet: 16가구 예제 입력
- requirements.txt: 검증에 사용한 패키지 버전
- evaluation/: 로컬 가중치로 재실행한 전체 평가 결과
- predictions/: 미래 예측 실행 결과

## 설치와 실행

이 폴더에서 새 가상환경을 만들고 실행합니다. 기존 검증 환경은 Python 3.10입니다.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -c "import pandas as pd; print(pd.read_parquet('data/hourly_base.parquet').house_id.unique())"
python inference.py --house-id HOUSE_ID --device cpu
```

HOUSE_ID를 위 명령에서 확인한 실제 ID로 바꿉니다.
입력은 house_id, timestamp, target_kwh 열을 가진 Parquet 또는 CSV입니다.
최근 연속 168시간에 결측이 없어야 합니다. 예측 시작점은 현재 날짜가 아니라
입력의 마지막 관측 다음 시각입니다. 실제 최신 예측에는 입력을 갱신해야 합니다.

```bash
python inference.py --house-id HOUSE_ID --data /path/to/recent.csv
HF_HUB_OFFLINE=1 python run_chronos2_covariates.py --device cpu
```

모델 실행 시 외부 가중치 다운로드는 필요하지 않습니다. 새 환경의 패키지 설치에는
인터넷이 필요합니다. 모델 설정과 가중치는 반드시 함께 옮기세요.
현재 묶음은 CLI용입니다. localhost HTTP API 또는 웹 화면은 포함하지 않습니다.

## 검증

CPU, 저장된 로컬 가중치, Hugging Face 오프라인 모드에서 16가구의 마지막
7일을 평가했습니다. 2,688개 예측, MAE 0.1210811 kWh,
WAPE 30.93999%, MASE(24) 0.728384로 기존 결과를 수치 오차 범위에서 재현했습니다.

원본 캐시 revision: 29ec3766d36d6f73f0696f85560a422f50e8498c
