#!/usr/bin/env python3
"""Generate a future hourly appliance forecast for one dashboard series."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parent
APPLIANCES = ("tv", "에어컨", "제습기", "세탁기")
COVARIATES = (
    "hour_sin",
    "hour_cos",
    "weekday_sin",
    "weekday_cos",
    "is_weekend",
    "is_holiday",
)


def add_calendar_covariates(frame: pd.DataFrame) -> pd.DataFrame:
    """Create only covariates whose future values are known in advance."""
    import holidays

    result = frame.copy()
    timestamp = pd.to_datetime(result["timestamp"], errors="raise")
    hour = timestamp.dt.hour.astype(np.float32)
    weekday = timestamp.dt.weekday.astype(np.float32)
    result["hour_sin"] = np.sin(2 * np.pi * hour / 24).astype(np.float32)
    result["hour_cos"] = np.cos(2 * np.pi * hour / 24).astype(np.float32)
    result["weekday_sin"] = np.sin(2 * np.pi * weekday / 7).astype(np.float32)
    result["weekday_cos"] = np.cos(2 * np.pi * weekday / 7).astype(np.float32)
    result["is_weekend"] = (timestamp.dt.weekday >= 5).astype(np.float32)
    holiday_dates = set(holidays.KR(years=sorted(timestamp.dt.year.unique())))
    result["is_holiday"] = timestamp.dt.date.isin(holiday_dates).astype(np.float32)
    return result


def detect_device(requested: str) -> str:
    if requested != "auto":
        return requested
    import torch

    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def point_prediction_column(frame: pd.DataFrame) -> str:
    for column in ("predictions", "prediction", "mean", "0.5"):
        if column in frame.columns:
            return column
    excluded = {"id", "timestamp", "target", "target_name"}
    numeric = [
        column
        for column in frame.select_dtypes(include=[np.number]).columns
        if column not in excluded
    ]
    if not numeric:
        raise ValueError(f"Prediction column not found: {frame.columns.tolist()}")
    return numeric[0]


def forecast(
    appliance: str,
    series_id: str,
    context_length: int,
    horizon: int,
    device: str,
) -> pd.DataFrame:
    from chronos import Chronos2Pipeline

    data_path = ROOT / "data" / appliance / "chronos_model_input.parquet"
    model_path = ROOT / "models" / appliance / "checkpoint"
    if not data_path.exists():
        raise FileNotFoundError(data_path)
    if not model_path.exists():
        raise FileNotFoundError(model_path)

    data = pd.read_parquet(data_path)
    data["timestamp"] = pd.to_datetime(data["timestamp"], errors="coerce")
    data["target_kwh"] = pd.to_numeric(data["target_kwh"], errors="coerce")
    context = (
        data[data["house_id"].astype(str).eq(series_id)]
        .dropna(subset=["timestamp", "target_kwh"])
        .sort_values("timestamp")
        .drop_duplicates("timestamp", keep="last")
        .tail(context_length)
    )
    if len(context) < context_length:
        available = sorted(data["house_id"].astype(str).unique())
        raise ValueError(
            f"{series_id!r} has {len(context)} valid hours; {context_length} required. "
            f"Available series: {available}"
        )

    context = context.rename(
        columns={"house_id": "id", "target_kwh": "target"}
    )[["id", "timestamp", "target"]]
    context = add_calendar_covariates(context)
    future = pd.DataFrame(
        {
            "id": series_id,
            "timestamp": pd.date_range(
                context["timestamp"].max() + pd.Timedelta(hours=1),
                periods=horizon,
                freq="1h",
            ),
        }
    )
    future = add_calendar_covariates(future)

    pipeline = Chronos2Pipeline.from_pretrained(
        model_path, device_map=detect_device(device)
    )
    prediction = pipeline.predict_df(
        context,
        future_df=future,
        prediction_length=horizon,
        quantile_levels=[0.1, 0.5, 0.9],
        id_column="id",
        timestamp_column="timestamp",
        target="target",
    )
    if "target_name" in prediction.columns:
        prediction = prediction[prediction["target_name"].astype(str).eq("target")]
    prediction = prediction.rename(
        columns={point_prediction_column(prediction): "prediction_kwh"}
    )
    keep = [
        column
        for column in ("id", "timestamp", "prediction_kwh", "0.1", "0.5", "0.9")
        if column in prediction.columns
    ]
    prediction = prediction[keep].rename(columns={"id": "series_id"})
    for column in ("prediction_kwh", "0.1", "0.5", "0.9"):
        if column in prediction:
            prediction[column] = pd.to_numeric(
                prediction[column], errors="coerce"
            ).clip(lower=0)
    prediction.insert(0, "appliance", appliance)
    return prediction.reset_index(drop=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--appliance", required=True, choices=APPLIANCES)
    identity = parser.add_mutually_exclusive_group(required=True)
    identity.add_argument("--series-id", help="Example: 정빈_tv")
    identity.add_argument("--subject", help="Example: 정빈")
    parser.add_argument("--context-length", type=int, default=336)
    parser.add_argument("--horizon", type=int, default=24)
    parser.add_argument(
        "--device", choices=["auto", "cpu", "cuda", "mps"], default="auto"
    )
    parser.add_argument("--output", type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    series_id = args.series_id or f"{args.subject}_{args.appliance}"
    result = forecast(
        args.appliance,
        series_id,
        args.context_length,
        args.horizon,
        args.device,
    )
    output = args.output or (
        ROOT / "predictions" / f"{series_id}_next_{args.horizon}h.csv"
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(output, index=False, encoding="utf-8-sig")
    print(
        json.dumps(
            {
                "appliance": args.appliance,
                "series_id": series_id,
                "rows": len(result),
                "forecast_start": str(result.timestamp.min()),
                "forecast_end": str(result.timestamp.max()),
                "output": str(output.resolve()),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
