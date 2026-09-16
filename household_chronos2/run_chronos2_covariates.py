#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chronos-2 zero-shot rolling day-ahead evaluation WITH known-future
calendar covariates.

Evaluation protocol is intentionally aligned with run_chronos2.py:
- Validation only for final evaluation
- previous 168 hourly observations as context
- next 24 hours as prediction horizon
- one forecast origin per day
- final 7 complete days per household
- same MAE / RMSE / sMAPE / WAPE / MASE(24)
- same daily-total evaluation

Covariates:
- hour_sin
- hour_cos
- weekday_sin
- weekday_cos
- is_weekend
- is_holiday

All covariates are known from the timestamp at forecast time, so future
target values are never used as inputs.

Recommended installation:
    pip install -U "chronos-forecasting[extras]>=2.2" holidays pyarrow

Run on Apple Silicon:
    python model/run_chronos2_covariates.py --device mps

Explicit Validation path:
    python model/run_chronos2_covariates.py \
      --validation-data data/preprocessing_data/validation/common/hourly_base.parquet \
      --device mps

Smoke test:
    python model/run_chronos2_covariates.py \
      --max-houses 5 \
      --validation-days 2 \
      --device mps
"""

from __future__ import annotations

import argparse
import json
import logging
import math
import random
from pathlib import Path

import numpy as np
import pandas as pd

LOGGER = logging.getLogger("chronos2_covariates")


DEFAULT_VALIDATION_DATA = (
    str(Path(__file__).resolve().parent / "data/hourly_base.parquet")
)
DEFAULT_OUTPUT = str(Path(__file__).resolve().parent / "evaluation")

COVARIATE_COLS = [
    "hour_sin",
    "hour_cos",
    "weekday_sin",
    "weekday_cos",
    "is_weekend",
    "is_holiday",
]


def setup_logging(verbose: bool = False) -> None:
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
    )


def set_seed(seed: int, include_torch: bool = True) -> None:
    random.seed(seed)
    np.random.seed(seed)

    if include_torch:
        try:
            import torch

            torch.manual_seed(seed)
            if torch.cuda.is_available():
                torch.cuda.manual_seed_all(seed)
        except Exception:
            pass


def detect_torch_device(requested: str = "auto") -> str:
    if requested != "auto":
        return requested

    try:
        import torch

        if torch.cuda.is_available():
            return "cuda"

        if (
            getattr(torch.backends, "mps", None) is not None
            and torch.backends.mps.is_available()
        ):
            return "mps"
    except Exception:
        pass

    return "cpu"


def resolve_input_path(path: str | Path) -> Path:
    candidate = Path(path).expanduser()

    if candidate.exists():
        return candidate.resolve()

    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent

    candidates = [
        Path.cwd() / candidate,
        project_root / candidate,
        script_dir / candidate,
    ]

    for item in candidates:
        if item.exists():
            return item.resolve()

    checked = "\n".join(f"  - {item}" for item in candidates)
    raise FileNotFoundError(
        f"File not found: {path}\n"
        f"Current working directory: {Path.cwd()}\n"
        f"Checked:\n{checked}"
    )


def resolve_output_path(path: str | Path) -> Path:
    """
    Resolve output path without requiring the directory to exist already.
    Relative paths are interpreted from the project root.
    """
    candidate = Path(path).expanduser()
    if candidate.is_absolute():
        return candidate

    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    return (project_root / candidate).resolve()


def read_table(path: str | Path) -> pd.DataFrame:
    resolved = resolve_input_path(path)
    suffix = resolved.suffix.lower()

    if suffix == ".parquet":
        return pd.read_parquet(resolved)
    if suffix == ".csv":
        return pd.read_csv(resolved)

    raise ValueError(
        f"Unsupported file format: {resolved.suffix}. Use .parquet or .csv."
    )


def write_table(df: pd.DataFrame, path: str | Path) -> None:
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)

    suffix = output.suffix.lower()
    if suffix == ".parquet":
        df.to_parquet(output, index=False)
    elif suffix == ".csv":
        df.to_csv(output, index=False)
    else:
        raise ValueError(f"Unsupported output format: {output.suffix}")


def save_json(obj: dict, path: str | Path) -> None:
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)

    with output.open("w", encoding="utf-8") as file:
        json.dump(
            obj,
            file,
            ensure_ascii=False,
            indent=2,
            default=str,
        )


def regression_metrics(
    y_true,
    y_pred,
    epsilon: float = 1e-8,
) -> dict:
    actual = np.asarray(y_true, dtype=np.float64).reshape(-1)
    prediction = np.asarray(y_pred, dtype=np.float64).reshape(-1)

    valid = np.isfinite(actual) & np.isfinite(prediction)
    actual = actual[valid]
    prediction = prediction[valid]

    if len(actual) == 0:
        raise ValueError("No finite values for metric calculation.")

    error = prediction - actual

    return {
        "n": int(len(actual)),
        "mae": float(np.mean(np.abs(error))),
        "rmse": float(np.sqrt(np.mean(error ** 2))),
        "smape": float(
            100
            * np.mean(
                2
                * np.abs(error)
                / (
                    np.abs(actual)
                    + np.abs(prediction)
                    + epsilon
                )
            )
        ),
        "wape": float(
            100
            * np.sum(np.abs(error))
            / (np.sum(np.abs(actual)) + epsilon)
        ),
    }


def metrics_by_group(
    data: pd.DataFrame,
    group_col: str,
) -> pd.DataFrame:
    rows = []

    for group_value, group in data.groupby(
        group_col,
        observed=True,
        sort=True,
    ):
        metrics = regression_metrics(
            group["actual_kwh"],
            group["prediction_kwh"],
        )
        rows.append(
            {
                group_col: group_value,
                **metrics,
            }
        )

    return pd.DataFrame(rows)


def build_korean_holiday_dates(
    timestamps: pd.Series,
    disable_holiday: bool,
) -> set:
    """
    Return Korean public-holiday dates covering the observed years.

    If --disable-holiday is used, returns an empty set and is_holiday is 0.
    """
    if disable_holiday:
        return set()

    years = sorted(
        pd.Series(pd.to_datetime(timestamps, errors="coerce"))
        .dropna()
        .dt.year
        .unique()
        .tolist()
    )

    if not years:
        return set()

    try:
        import holidays
    except ImportError as exc:
        raise SystemExit(
            "The 'holidays' package is required to generate is_holiday.\n"
            "Install it with:\n"
            "    pip install holidays\n"
            "Or run with --disable-holiday to use only hour/weekday/weekend."
        ) from exc

    kr_holidays = holidays.KR(years=years)
    return set(kr_holidays.keys())


def add_calendar_covariates(
    df: pd.DataFrame,
    disable_holiday: bool = False,
) -> pd.DataFrame:
    """
    Generate future-known calendar covariates only from timestamp.

    No future electricity measurements are used.
    """
    result = df.copy()
    ts = pd.to_datetime(result["timestamp"], errors="coerce")

    hour = ts.dt.hour.astype(np.float32)
    weekday = ts.dt.weekday.astype(np.float32)

    result["hour_sin"] = np.sin(2.0 * np.pi * hour / 24.0).astype(np.float32)
    result["hour_cos"] = np.cos(2.0 * np.pi * hour / 24.0).astype(np.float32)

    result["weekday_sin"] = np.sin(
        2.0 * np.pi * weekday / 7.0
    ).astype(np.float32)
    result["weekday_cos"] = np.cos(
        2.0 * np.pi * weekday / 7.0
    ).astype(np.float32)

    result["is_weekend"] = (
        ts.dt.weekday >= 5
    ).astype(np.float32)

    holiday_dates = build_korean_holiday_dates(
        ts,
        disable_holiday=disable_holiday,
    )
    if disable_holiday:
        result["is_holiday"] = np.float32(0.0)
    else:
        result["is_holiday"] = (
            ts.dt.date.isin(holiday_dates)
        ).astype(np.float32)

    return result


def prepare_series(
    df: pd.DataFrame,
    disable_holiday: bool = False,
) -> pd.DataFrame:
    """
    Validate, sort, hourly-reindex every household, then generate
    calendar covariates from timestamps.
    """
    required = {"house_id", "timestamp", "target_kwh"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    result = df[["house_id", "timestamp", "target_kwh"]].copy()
    result["house_id"] = result["house_id"].astype(str)
    result["timestamp"] = pd.to_datetime(
        result["timestamp"],
        errors="coerce",
    )
    result["target_kwh"] = pd.to_numeric(
        result["target_kwh"],
        errors="coerce",
    )

    result = (
        result.dropna(subset=["house_id", "timestamp"])
        .sort_values(["house_id", "timestamp"])
        .drop_duplicates(["house_id", "timestamp"], keep="last")
        .reset_index(drop=True)
    )

    frames: list[pd.DataFrame] = []

    for house_id, group in result.groupby("house_id", sort=False):
        group = group.set_index("timestamp").sort_index()

        full_index = pd.date_range(
            start=group.index.min(),
            end=group.index.max(),
            freq="1h",
        )

        group = group.reindex(full_index)
        group.index.name = "timestamp"
        group["house_id"] = house_id
        frames.append(group.reset_index())

    if not frames:
        raise ValueError("No valid household series were found.")

    result = pd.concat(frames, ignore_index=True)
    result = add_calendar_covariates(
        result,
        disable_holiday=disable_holiday,
    )

    return result


def prediction_column(pred_df: pd.DataFrame) -> str:
    """Find the point/median forecast column returned by Chronos-2."""
    for candidate in ("predictions", "prediction", "mean", "0.5"):
        if candidate in pred_df.columns:
            return candidate

    numeric = [
        col
        for col in pred_df.select_dtypes(include=[np.number]).columns
        if col not in {"target"}
    ]

    if not numeric:
        raise ValueError(
            "Could not identify prediction column. "
            f"Columns={pred_df.columns.tolist()}"
        )

    return numeric[0]


def seasonal_scale(
    history: np.ndarray,
    seasonality: int,
    epsilon: float = 1e-8,
) -> float:
    values = np.asarray(history, dtype=np.float64)
    values = values[np.isfinite(values)]

    if seasonality < 1:
        raise ValueError("seasonality must be at least 1.")

    if len(values) <= seasonality:
        return float("nan")

    scale = np.mean(
        np.abs(values[seasonality:] - values[:-seasonality])
    )

    if not np.isfinite(scale) or scale <= epsilon:
        return float("nan")

    return float(scale)


def build_origin_batch(
    validation_data: pd.DataFrame,
    day_offset: int,
    validation_days: int,
    context_length: int,
    prediction_length: int,
    mase_seasonality: int,
    max_houses: int | None,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Build one daily rolling forecast batch.

    context_df:
        id, timestamp, target + historical calendar covariates

    future_df:
        id, timestamp + the SAME calendar covariate columns
        for the next 24 hours

    truth_df:
        actual target values, used only after prediction
    """
    context_frames: list[pd.DataFrame] = []
    future_frames: list[pd.DataFrame] = []
    truth_frames: list[pd.DataFrame] = []
    scale_rows: list[dict] = []

    houses = sorted(validation_data["house_id"].dropna().unique())
    if max_houses is not None:
        houses = houses[:max_houses]

    for house_id in houses:
        group = (
            validation_data[validation_data["house_id"] == house_id]
            .sort_values("timestamp")
            .reset_index(drop=True)
        )

        if group.empty:
            continue

        max_date = group["timestamp"].dt.normalize().max()
        valid_start = max_date - pd.Timedelta(days=validation_days - 1)
        forecast_start = valid_start + pd.Timedelta(days=day_offset)
        forecast_end = forecast_start + pd.Timedelta(
            hours=prediction_length
        )
        origin = forecast_start - pd.Timedelta(hours=1)

        context = (
            group[group["timestamp"] <= origin]
            .tail(context_length)
            .copy()
        )

        future = group[
            (group["timestamp"] >= forecast_start)
            & (group["timestamp"] < forecast_end)
        ].copy()

        if len(context) < context_length:
            continue
        if len(future) != prediction_length:
            continue
        if context["target_kwh"].isna().any():
            continue
        if future["target_kwh"].isna().any():
            continue
        if context[COVARIATE_COLS].isna().any().any():
            continue
        if future[COVARIATE_COLS].isna().any().any():
            continue

        scale = seasonal_scale(
            context["target_kwh"].to_numpy(),
            seasonality=mase_seasonality,
        )
        if not np.isfinite(scale):
            LOGGER.warning(
                "Skipping MASE scale for house=%s, forecast_start=%s",
                house_id,
                forecast_start,
            )

        context_chronos = context.rename(
            columns={
                "house_id": "id",
                "target_kwh": "target",
            }
        )[
            ["id", "timestamp", "target", *COVARIATE_COLS]
        ]

        # IMPORTANT:
        # future_df intentionally excludes target_kwh.
        # Only timestamp-derived known-future covariates are passed.
        future_chronos = future.rename(
            columns={"house_id": "id"}
        )[
            ["id", "timestamp", *COVARIATE_COLS]
        ]

        truth = future.rename(
            columns={
                "house_id": "id",
                "target_kwh": "actual_kwh",
            }
        )[
            ["id", "timestamp", "actual_kwh"]
        ]

        context_frames.append(context_chronos)
        future_frames.append(future_chronos)
        truth_frames.append(truth)

        scale_rows.append(
            {
                "id": house_id,
                "forecast_start": forecast_start,
                "mase_scale": scale,
                "context_rows": int(len(context)),
            }
        )

    if not context_frames:
        return (
            pd.DataFrame(),
            pd.DataFrame(),
            pd.DataFrame(),
            pd.DataFrame(),
        )

    return (
        pd.concat(context_frames, ignore_index=True),
        pd.concat(future_frames, ignore_index=True),
        pd.concat(truth_frames, ignore_index=True),
        pd.DataFrame(scale_rows),
    )


def attach_mase_metrics(
    results: pd.DataFrame,
    mase_seasonality: int,
) -> tuple[dict, pd.DataFrame, pd.DataFrame]:
    scored = results.copy()
    scored["absolute_error"] = np.abs(
        scored["actual_kwh"] - scored["prediction_kwh"]
    )

    valid = (
        np.isfinite(scored["absolute_error"])
        & np.isfinite(scored["mase_scale"])
        & (scored["mase_scale"] > 0)
    )

    scored["scaled_absolute_error"] = np.nan
    scored.loc[valid, "scaled_absolute_error"] = (
        scored.loc[valid, "absolute_error"]
        / scored.loc[valid, "mase_scale"]
    )

    window_metrics = (
        scored.groupby(
            ["house_id", "forecast_day_offset", "forecast_start"],
            as_index=False,
            observed=True,
        )
        .agg(
            n=("actual_kwh", "size"),
            mae=("absolute_error", "mean"),
            mase_scale=("mase_scale", "first"),
            mase=("scaled_absolute_error", "mean"),
        )
    )

    house_mase = (
        window_metrics.groupby(
            "house_id",
            as_index=False,
            observed=True,
        )
        .agg(
            windows=("mase", "count"),
            mase_macro=("mase", "mean"),
        )
    )

    valid_rows = scored.dropna(
        subset=["absolute_error", "mase_scale"]
    )
    valid_rows = valid_rows[valid_rows["mase_scale"] > 0]

    if valid_rows.empty:
        global_mase = float("nan")
        macro_mase = float("nan")
        house_macro_mase = float("nan")
        valid_rows_count = 0
        valid_windows = 0
    else:
        denominator = float(valid_rows["mase_scale"].sum())
        numerator = float(valid_rows["absolute_error"].sum())

        global_mase = (
            numerator / denominator
            if denominator > 0
            else float("nan")
        )
        macro_mase = float(window_metrics["mase"].mean())
        house_macro_mase = float(
            house_mase["mase_macro"].mean()
        )
        valid_rows_count = int(len(valid_rows))
        valid_windows = int(
            window_metrics["mase"].notna().sum()
        )

    summary = {
        "seasonality": int(mase_seasonality),
        "global": global_mase,
        "window_macro": macro_mase,
        "house_macro": house_macro_mase,
        "valid_rows": valid_rows_count,
        "valid_windows": valid_windows,
        "interpretation": (
            "<1 means better than the seasonal-naive scale; "
            ">1 means worse."
        ),
    }

    return summary, window_metrics, house_mase


def run(args: argparse.Namespace) -> None:
    try:
        from chronos import Chronos2Pipeline
    except ImportError as exc:
        raise SystemExit(
            "Chronos is not installed.\n"
            'Install with: pip install -U "chronos-forecasting[extras]>=2.2" torch'
        ) from exc

    if args.prediction_length <= 0:
        raise ValueError("prediction-length must be positive.")

    if args.context_length <= args.mase_seasonality:
        raise ValueError(
            "context-length must be larger than mase-seasonality. "
            f"Received context={args.context_length}, "
            f"seasonality={args.mase_seasonality}."
        )

    set_seed(args.seed, include_torch=True)

    validation_path = resolve_input_path(args.validation_data)
    validation_data = prepare_series(
        read_table(validation_path),
        disable_holiday=args.disable_holiday,
    )

    LOGGER.info(
        "[Validation] rows=%s, houses=%s, period=%s ~ %s",
        f"{len(validation_data):,}",
        validation_data["house_id"].nunique(),
        validation_data["timestamp"].min(),
        validation_data["timestamp"].max(),
    )
    LOGGER.info(
        "Known-future covariates: %s",
        ", ".join(COVARIATE_COLS),
    )

    device = detect_torch_device(args.device)
    LOGGER.info(
        "Loading %s on device=%s",
        args.model_id,
        device,
    )

    pipeline = Chronos2Pipeline.from_pretrained(
        args.model_id,
        device_map=device,
    )

    all_predictions: list[pd.DataFrame] = []
    skipped_days = 0

    for day_offset in range(args.validation_days):
        (
            context_df,
            future_df,
            truth_df,
            scale_df,
        ) = build_origin_batch(
            validation_data=validation_data,
            day_offset=day_offset,
            validation_days=args.validation_days,
            context_length=args.context_length,
            prediction_length=args.prediction_length,
            mase_seasonality=args.mase_seasonality,
            max_houses=args.max_houses,
        )

        if context_df.empty:
            skipped_days += 1
            LOGGER.warning(
                "No valid Validation series for day offset %s",
                day_offset,
            )
            continue

        LOGGER.info(
            "Forecast day %s/%s | Validation houses=%s",
            day_offset + 1,
            args.validation_days,
            context_df["id"].nunique(),
        )

        pred_df = pipeline.predict_df(
            context_df,
            future_df=future_df,
            prediction_length=args.prediction_length,
            quantile_levels=[0.1, 0.5, 0.9],
            id_column="id",
            timestamp_column="timestamp",
            target="target",
        )

        # Chronos-2 may return target_name for dataframe forecasts.
        if "target_name" in pred_df.columns:
            pred_df = pred_df[
                pred_df["target_name"].astype(str) == "target"
            ].copy()

        pred_col = prediction_column(pred_df)
        pred_df = pred_df.rename(
            columns={pred_col: "prediction_kwh"}
        )

        keep_pred_cols = [
            col
            for col in [
                "id",
                "timestamp",
                "prediction_kwh",
                "0.1",
                "0.5",
                "0.9",
            ]
            if col in pred_df.columns
        ]
        pred_df = pred_df[keep_pred_cols].copy()

        merged = truth_df.merge(
            pred_df,
            on=["id", "timestamp"],
            how="inner",
            validate="one_to_one",
        )

        merged = merged.merge(
            scale_df[
                ["id", "forecast_start", "mase_scale"]
            ],
            on="id",
            how="left",
            validate="many_to_one",
        )

        merged["prediction_kwh"] = (
            pd.to_numeric(
                merged["prediction_kwh"],
                errors="coerce",
            )
            .clip(lower=0)
        )

        for quantile_col in ("0.1", "0.5", "0.9"):
            if quantile_col in merged.columns:
                merged[quantile_col] = (
                    pd.to_numeric(
                        merged[quantile_col],
                        errors="coerce",
                    )
                    .clip(lower=0)
                )

        merged["forecast_day_offset"] = day_offset
        merged["horizon"] = (
            merged.groupby("id", observed=True).cumcount() + 1
        ).astype("int16")

        all_predictions.append(merged)

    if not all_predictions:
        raise RuntimeError(
            "No forecasts were produced. Check hourly continuity, "
            "context length, prediction length, Validation path, "
            "and validation-day settings."
        )

    results = (
        pd.concat(all_predictions, ignore_index=True)
        .rename(columns={"id": "house_id"})
        .sort_values(
            ["house_id", "forecast_day_offset", "timestamp"]
        )
        .reset_index(drop=True)
    )

    output_dir = resolve_output_path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    overall = regression_metrics(
        results["actual_kwh"],
        results["prediction_kwh"],
    )

    horizon_metrics = metrics_by_group(
        results,
        "horizon",
    )
    house_metrics = metrics_by_group(
        results,
        "house_id",
    )

    (
        mase_summary,
        mase_by_window,
        mase_by_house,
    ) = attach_mase_metrics(
        results,
        mase_seasonality=args.mase_seasonality,
    )

    overall[f"mase_{args.mase_seasonality}_global"] = (
        mase_summary["global"]
    )
    overall[
        f"mase_{args.mase_seasonality}_window_macro"
    ] = mase_summary["window_macro"]
    overall[
        f"mase_{args.mase_seasonality}_house_macro"
    ] = mase_summary["house_macro"]

    daily = (
        results.assign(
            date=results["timestamp"].dt.date
        )
        .groupby(
            ["house_id", "date"],
            as_index=False,
            observed=True,
        )
        .agg(
            actual_kwh=("actual_kwh", "sum"),
            prediction_kwh=("prediction_kwh", "sum"),
        )
    )

    daily_metrics = regression_metrics(
        daily["actual_kwh"],
        daily["prediction_kwh"],
    )

    write_table(
        results,
        output_dir / "validation_predictions.parquet",
    )
    write_table(
        horizon_metrics,
        output_dir / "validation_metrics_by_horizon.parquet",
    )
    write_table(
        house_metrics,
        output_dir / "validation_metrics_by_house.parquet",
    )
    write_table(
        mase_by_window,
        output_dir / "validation_mase_by_window.parquet",
    )
    write_table(
        mase_by_house,
        output_dir / "validation_mase_by_house.parquet",
    )
    write_table(
        daily,
        output_dir / "validation_daily_predictions.parquet",
    )

    summary = {
        "model": args.model_id,
        "device": device,
        "mode": (
            "zero-shot rolling day-ahead evaluation with "
            "known-future calendar covariates"
        ),
        "validation_data": str(validation_path),
        "context_source": (
            "observed target values from the same Validation "
            "house before each forecast origin"
        ),
        "covariate_source": (
            "timestamp-derived known-future calendar features only"
        ),
        "covariates": COVARIATE_COLS,
        "holiday_feature_enabled": not args.disable_holiday,
        "context_length": args.context_length,
        "prediction_length": args.prediction_length,
        "validation_days": args.validation_days,
        "mase_seasonality": args.mase_seasonality,
        "skipped_days": skipped_days,
        "forecast_rows": int(len(results)),
        "houses": int(results["house_id"].nunique()),
        "overall_hourly": overall,
        "mase": mase_summary,
        "daily_total": daily_metrics,
    }

    save_json(
        summary,
        output_dir / "metrics.json",
    )

    LOGGER.info(
        "Validation hourly metrics: %s",
        overall,
    )
    LOGGER.info(
        "Validation MASE: %s",
        mase_summary,
    )
    LOGGER.info(
        "Validation daily-total metrics: %s",
        daily_metrics,
    )
    LOGGER.info(
        "Saved outputs: %s",
        output_dir,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--validation-data",
        "--data",
        dest="validation_data",
        default=DEFAULT_VALIDATION_DATA,
        help=(
            "Separate Validation parquet/csv containing at least "
            "house_id, timestamp, target_kwh."
        ),
    )
    parser.add_argument(
        "--output-dir",
        default=DEFAULT_OUTPUT,
    )
    parser.add_argument(
        "--model-id",
        default=str(Path(__file__).resolve().parent / "checkpoint"),
    )
    parser.add_argument(
        "--context-length",
        type=int,
        default=168,
    )
    parser.add_argument(
        "--prediction-length",
        type=int,
        default=24,
    )
    parser.add_argument(
        "--validation-days",
        type=int,
        default=7,
    )
    parser.add_argument(
        "--mase-seasonality",
        type=int,
        default=24,
        help="Seasonal period used in the MASE denominator.",
    )
    parser.add_argument(
        "--max-houses",
        type=int,
        default=None,
    )
    parser.add_argument(
        "--device",
        choices=["auto", "cpu", "cuda", "mps"],
        default="auto",
    )
    parser.add_argument(
        "--disable-holiday",
        action="store_true",
        help=(
            "Do not use Korean public-holiday covariate. "
            "Useful if the holidays package is not installed."
        ),
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
    )

    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    setup_logging(arguments.verbose)
    run(arguments)
