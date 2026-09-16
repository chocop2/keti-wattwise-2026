"""Run the bundled household Chronos-2 checkpoint on a benchmark HTML series."""
import argparse, json, re
from pathlib import Path
import numpy as np
import pandas as pd
from chronos import Chronos2Pipeline
from run_chronos2_covariates import COVARIATE_COLS, add_calendar_covariates, prepare_series, prediction_column

ROOT = Path(__file__).resolve().parent

def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--house-id", required=True); parser.add_argument("--benchmark", type=Path, default=ROOT.parent / "public/dash/benchmark.html"); parser.add_argument("--device", default="cpu", choices=["cpu", "mps", "cuda"]); args = parser.parse_args()
    match = re.search(r"const DATA=(.*?);\s*\n", args.benchmark.read_text(encoding="utf-8"))
    if not match: raise ValueError("benchmark data not found")
    data = json.loads(match.group(1)); item = data.get(args.house_id)
    if item is None: raise ValueError(f"Unknown benchmark house: {args.house_id}")
    raw = pd.DataFrame({"house_id": args.house_id, "timestamp": pd.date_range(pd.Timestamp(item["start"]), periods=len(item["y"]), freq="h"), "target_kwh": item["y"]})
    context = prepare_series(raw).tail(168)
    if len(context) != 168 or not np.isfinite(context["target_kwh"]).all(): raise ValueError("최근 168시간 관측이 필요합니다.")
    context = context.rename(columns={"house_id": "id", "target_kwh": "target"})[["id", "timestamp", "target", *COVARIATE_COLS]]
    future = add_calendar_covariates(pd.DataFrame({"id": args.house_id, "timestamp": pd.date_range(context.timestamp.iloc[-1] + pd.Timedelta(hours=1), periods=24, freq="h")}))
    model = Chronos2Pipeline.from_pretrained(str(ROOT / "checkpoint"), device_map=args.device, local_files_only=True)
    result = model.predict_df(context, future_df=future, prediction_length=24, quantile_levels=[0.1, 0.5, 0.9], id_column="id", timestamp_column="timestamp", target="target")
    if "target_name" in result: result = result[result.target_name == "target"]
    result = result.rename(columns={prediction_column(result): "prediction_kwh", "id": "house_id"}); result["prediction_kwh"] = result["prediction_kwh"].clip(lower=0)
    print(result.to_json(orient="records", force_ascii=False, date_format="iso"))

if __name__ == "__main__": main()
