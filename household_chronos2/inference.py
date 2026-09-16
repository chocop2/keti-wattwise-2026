"""Forecast a household's next 24 hours using the bundled local checkpoint."""
import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from chronos import Chronos2Pipeline

from run_chronos2_covariates import (
    COVARIATE_COLS, add_calendar_covariates, prepare_series, prediction_column,
)

ROOT = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--house-id', required=True)
    parser.add_argument('--data', type=Path, default=ROOT / 'data/hourly_base.parquet')
    parser.add_argument('--device', default='cpu', choices=['cpu', 'mps', 'cuda'])
    parser.add_argument('--output', type=Path, default=ROOT / 'predictions/next_24h.csv')
    args = parser.parse_args()
    raw = pd.read_csv(args.data) if args.data.suffix == '.csv' else pd.read_parquet(args.data)
    raw = raw[raw['house_id'].astype(str) == args.house_id]
    if raw.empty:
        raise ValueError(f'Unknown house_id: {args.house_id}')
    context = prepare_series(raw).tail(168)
    if len(context) != 168 or not np.isfinite(context['target_kwh']).all():
        raise ValueError('The latest 168 consecutive hourly observations must be finite.')
    context = context.rename(columns={'house_id': 'id', 'target_kwh': 'target'})
    context = context[['id', 'timestamp', 'target', *COVARIATE_COLS]]
    future = pd.DataFrame({
        'id': args.house_id,
        'timestamp': pd.date_range(context['timestamp'].iloc[-1] + pd.Timedelta(hours=1), periods=24, freq='h'),
    })
    future = add_calendar_covariates(future)
    pipeline = Chronos2Pipeline.from_pretrained(
        str(ROOT / 'checkpoint'), device_map=args.device, local_files_only=True,
    )
    result = pipeline.predict_df(
        context, future_df=future, prediction_length=24,
        quantile_levels=[0.1, 0.5, 0.9], id_column='id',
        timestamp_column='timestamp', target='target',
    )
    if 'target_name' in result:
        result = result[result['target_name'] == 'target'].copy()
    result = result.rename(columns={prediction_column(result): 'prediction_kwh', 'id': 'house_id'})
    result['prediction_kwh'] = result['prediction_kwh'].clip(lower=0)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(args.output, index=False)
    print(f'Saved {len(result)} forecasts: {args.output}')


if __name__ == '__main__':
    main()
