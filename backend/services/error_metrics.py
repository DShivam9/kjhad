"""
Forecast Error Metrics & Statistical Evaluation Service

Calculates key quantitative metrics to evaluate wind generation forecast accuracy:
- Mean Absolute Error (MAE) [MW]
- Root Mean Square Error (RMSE) [MW]
- Mean Absolute Percentage Error (MAPE) [%]
- Mean Bias Error (MBE) [MW] (directional bias: positive = overforecasting)
- Normalized MAE (nMAE) [%]
- Error distribution percentiles (P10, P50, P90)
- Half-hourly diurnal error profile (48 settlement periods)
"""

from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd

from backend.services.data_pipeline import market_store


def calculate_metrics_from_pairs(
    actual_values: List[float],
    forecast_values: List[float],
) -> Dict[str, Any]:
    """
    Computes statistical accuracy metrics from matched actual and forecast arrays.
    """
    actual_array = np.array(actual_values, dtype=float)
    forecast_array = np.array(forecast_values, dtype=float)

    # Filter out any NaN or None values
    valid_mask = ~np.isnan(actual_array) & ~np.isnan(forecast_array)
    actual_clean = actual_array[valid_mask]
    forecast_clean = forecast_array[valid_mask]

    sample_count = len(actual_clean)
    if sample_count == 0:
        return {
            "sample_count": 0,
            "mean_absolute_error_mw": 0.0,
            "root_mean_square_error_mw": 0.0,
            "mean_absolute_percentage_error": 0.0,
            "mean_bias_error_mw": 0.0,
            "normalized_mae_percent": 0.0,
            "percentiles": {"p10": 0.0, "p50": 0.0, "p90": 0.0},
            "max_overforecast_mw": 0.0,
            "max_underforecast_mw": 0.0,
        }

    # Error definitions:
    # signed_error: positive when forecast > actual (overforecast), negative when actual > forecast
    signed_errors = forecast_clean - actual_clean
    absolute_errors = np.abs(signed_errors)

    mae = float(np.mean(absolute_errors))
    rmse = float(np.sqrt(np.mean(signed_errors**2)))
    mbe = float(np.mean(signed_errors))

    # MAPE: avoid divide-by-zero by filtering out near-zero actuals (< 50 MW)
    significant_actuals_mask = actual_clean > 50.0
    if np.any(significant_actuals_mask):
        mape = float(
            np.mean(
                absolute_errors[significant_actuals_mask] / actual_clean[significant_actuals_mask]
            )
            * 100.0
        )
    else:
        mape = 0.0

    # Normalized MAE relative to maximum observed actual wind generation in sample
    max_capacity = float(np.max(actual_clean)) if np.max(actual_clean) > 0 else 1.0
    nmae = float((mae / max_capacity) * 100.0)

    p10 = float(np.percentile(signed_errors, 10))
    p50 = float(np.percentile(signed_errors, 50))
    p90 = float(np.percentile(signed_errors, 90))

    max_overforecast = float(np.max(signed_errors)) if len(signed_errors) > 0 else 0.0
    max_underforecast = float(np.min(signed_errors)) if len(signed_errors) > 0 else 0.0

    return {
        "sample_count": sample_count,
        "mean_absolute_error_mw": round(mae, 2),
        "root_mean_square_error_mw": round(rmse, 2),
        "mean_absolute_percentage_error": round(mape, 2),
        "mean_bias_error_mw": round(mbe, 2),
        "normalized_mae_percent": round(nmae, 2),
        "percentiles": {
            "p10": round(p10, 2),
            "p50": round(p50, 2),
            "p90": round(p90, 2),
        },
        "max_overforecast_mw": round(max_overforecast, 2),
        "max_underforecast_mw": round(max_underforecast, 2),
    }


def get_monthly_evaluation_summary(cutoff_hour_utc: int = 11) -> Dict[str, Any]:
    """
    Computes overall error metrics across all 31 days in January 2026.
    Also generates error histogram bins and diurnal half-hourly profiles.
    """
    if not market_store._is_initialized:
        market_store.initialize()

    all_actuals: List[float] = []
    all_forecasts: List[float] = []
    period_buckets: Dict[int, List[Dict[str, float]]] = {period: [] for period in range(1, 49)}

    # Iterate through all 31 days of January 2026
    for day in range(1, 32):
        date_str = f"2026-01-{day:02d}"
        daily_schedule = market_store.get_day_ahead_schedule(
            delivery_date_str=date_str,
            cutoff_hour_utc=cutoff_hour_utc,
        )
        for row in daily_schedule:
            actual = row.get("actual_mw")
            forecast = row.get("forecast_mw")
            period = row.get("settlement_period", 1)
            if actual is not None and forecast is not None:
                all_actuals.append(actual)
                all_forecasts.append(forecast)
                period_buckets[period].append({"actual": actual, "forecast": forecast})

    overall_metrics = calculate_metrics_from_pairs(all_actuals, all_forecasts)

    # 1. Error histogram distribution (signed error: forecast - actual)
    signed_errors = np.array(all_forecasts) - np.array(all_actuals)
    histogram_counts, bin_edges = np.histogram(signed_errors, bins=25)
    histogram_data = []
    for count, left_edge, right_edge in zip(histogram_counts, bin_edges[:-1], bin_edges[1:]):
        histogram_data.append({
            "bin_center_mw": round(float((left_edge + right_edge) / 2), 0),
            "range_label": f"{int(left_edge)} to {int(right_edge)} MW",
            "frequency": int(count),
        })

    # 2. Diurnal Settlement Period Profile (averages for periods 1 to 48)
    diurnal_profile = []
    for period in range(1, 49):
        bucket = period_buckets[period]
        period_actuals = [item["actual"] for item in bucket]
        period_forecasts = [item["forecast"] for item in bucket]
        period_metrics = calculate_metrics_from_pairs(period_actuals, period_forecasts)

        # Convert settlement period to standard hour string (e.g. Period 1 -> "00:00 - 00:30")
        hour = (period - 1) // 2
        minute = "30" if period % 2 == 0 else "00"
        diurnal_profile.append({
            "settlement_period": period,
            "time_label": f"{hour:02d}:{minute}",
            "mae_mw": period_metrics["mean_absolute_error_mw"],
            "rmse_mw": period_metrics["root_mean_square_error_mw"],
            "bias_mw": period_metrics["mean_bias_error_mw"],
        })

    return {
        "cutoff_hour_utc": cutoff_hour_utc,
        "overall_metrics": overall_metrics,
        "histogram": histogram_data,
        "diurnal_profile": diurnal_profile,
    }


if __name__ == "__main__":
    print("Testing forecast error metrics engine...")
    summary = get_monthly_evaluation_summary(cutoff_hour_utc=11)
    metrics = summary["overall_metrics"]
    print(f"January 2026 Evaluation Summary (Gate Closure 11:00 UTC):")
    print(f"  Samples: {metrics['sample_count']}")
    print(f"  MAE:     {metrics['mean_absolute_error_mw']} MW")
    print(f"  RMSE:    {metrics['root_mean_square_error_mw']} MW")
    print(f"  MAPE:    {metrics['mean_absolute_percentage_error']} %")
    print(f"  Bias:    {metrics['mean_bias_error_mw']} MW")
    print(f"  Diurnal profile periods: {len(summary['diurnal_profile'])}")
    print(f"  Histogram bins: {len(summary['histogram'])}")
    assert metrics["sample_count"] > 1400, "Expected full month of settlement periods"
    assert metrics["mean_absolute_error_mw"] > 0, "MAE must be positive"
    print("Error metrics engine verification successful!")
