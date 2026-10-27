"""
Forecast API Endpoints
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import numpy as np

from backend.models.schemas import DayAheadScheduleResponse, DailySummary
from backend.services.data_pipeline import market_store

router = APIRouter(prefix="/api/forecast", tags=["Day-Ahead Forecasts"])


@router.get("/day-ahead", response_model=DayAheadScheduleResponse)
def get_day_ahead_schedule(
    delivery_date: str = Query(
        default="2026-01-15",
        description="Delivery Date in January 2026 (YYYY-MM-DD)",
        pattern=r"^2026-01-(0[1-9]|[12][0-9]|3[01])$",
    ),
    cutoff_hour: int = Query(
        default=11,
        ge=0,
        le=23,
        description="Day D-1 Auction Cutoff Hour (UTC)",
    ),
):
    """
    Returns the Day-Ahead wind forecast matched with actual generation
    for all 48 settlement periods of a target delivery day.
    """
    schedule = market_store.get_day_ahead_schedule(
        delivery_date_str=delivery_date,
        cutoff_hour_utc=cutoff_hour,
    )

    if not schedule:
        raise HTTPException(status_code=404, detail=f"No data available for date {delivery_date}")

    actual_values = [r["actual_mw"] for r in schedule if r["actual_mw"] is not None]
    forecast_values = [r["forecast_mw"] for r in schedule if r["forecast_mw"] is not None]
    error_values = [r["error_mw"] for r in schedule if r["error_mw"] is not None]

    # Convert half-hourly MW to MWh (each period is 0.5 hours)
    total_actual_mwh = sum(actual_values) * 0.5 if actual_values else 0.0
    total_forecast_mwh = sum(forecast_values) * 0.5 if forecast_values else 0.0
    daily_mae = float(np.mean(np.abs(error_values))) if error_values else 0.0

    # Shortfall occurs when actual < forecast (error_mw is negative)
    peak_deficit = abs(min(error_values)) if (error_values and min(error_values) < 0) else 0.0
    peak_surplus = max(error_values) if (error_values and max(error_values) > 0) else 0.0

    summary = DailySummary(
        delivery_date=delivery_date,
        cutoff_hour_utc=cutoff_hour,
        total_actual_mwh=round(total_actual_mwh, 1),
        total_forecast_mwh=round(total_forecast_mwh, 1),
        mean_absolute_error_mw=round(daily_mae, 1),
        peak_deficit_mw=round(peak_deficit, 1),
        peak_surplus_mw=round(peak_surplus, 1),
    )

    return DayAheadScheduleResponse(
        delivery_date=delivery_date,
        cutoff_hour_utc=cutoff_hour,
        summary=summary,
        schedule=schedule,
    )
