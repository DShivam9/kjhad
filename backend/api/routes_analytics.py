"""
Analytics API Endpoints
"""

from fastapi import APIRouter, Query
from typing import List
import numpy as np

from backend.models.schemas import MonthlyAnalyticsResponse, MonthlyDailyBreakdownResponse, DailyPerformanceItem
from backend.services.error_metrics import get_monthly_evaluation_summary
from backend.services.data_pipeline import market_store

router = APIRouter(prefix="/api/analytics", tags=["Error Analytics"])


@router.get("/monthly-summary", response_model=MonthlyAnalyticsResponse)
def get_monthly_summary(
    cutoff_hour: int = Query(
        default=11,
        ge=0,
        le=23,
        description="Day D-1 Auction Cutoff Hour (UTC)",
    ),
):
    """
    Returns monthly statistical error metrics, error distribution histogram,
    and half-hourly diurnal error breakdown for January 2026.
    """
    summary = get_monthly_evaluation_summary(cutoff_hour_utc=cutoff_hour)
    return MonthlyAnalyticsResponse(**summary)


@router.get("/daily-breakdown", response_model=MonthlyDailyBreakdownResponse)
def get_daily_breakdown(
    cutoff_hour: int = Query(
        default=11,
        ge=0,
        le=23,
        description="Day D-1 Auction Cutoff Hour (UTC)",
    ),
):
    """
    Returns daily performance comparison (MAE, RMSE, Actual MWh, Forecast MWh)
    for each of the 31 days in January 2026.
    """
    if not market_store._is_initialized:
        market_store.initialize()

    days_data: List[DailyPerformanceItem] = []
    for day in range(1, 32):
        date_str = f"2026-01-{day:02d}"
        schedule = market_store.get_day_ahead_schedule(
            delivery_date_str=date_str,
            cutoff_hour_utc=cutoff_hour,
        )
        actuals = [r["actual_mw"] for r in schedule if r["actual_mw"] is not None]
        forecasts = [r["forecast_mw"] for r in schedule if r["forecast_mw"] is not None]

        if actuals and forecasts:
            errors = np.array(actuals) - np.array(forecasts)
            mae = float(np.mean(np.abs(errors)))
            rmse = float(np.sqrt(np.mean(errors**2)))
            actual_mwh = sum(actuals) * 0.5
            forecast_mwh = sum(forecasts) * 0.5
        else:
            mae, rmse, actual_mwh, forecast_mwh = 0.0, 0.0, 0.0, 0.0

        days_data.append(
            DailyPerformanceItem(
                date=date_str,
                mae_mw=round(mae, 1),
                rmse_mw=round(rmse, 1),
                actual_mwh=round(actual_mwh, 1),
                forecast_mwh=round(forecast_mwh, 1),
            )
        )

    return MonthlyDailyBreakdownResponse(cutoff_hour_utc=cutoff_hour, days=days_data)
