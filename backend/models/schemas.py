"""
Pydantic Schemas for API Requests & Responses
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SettlementPeriodData(BaseModel):
    settlement_period: int = Field(..., description="UK settlement period from 1 to 48")
    start_time: str = Field(..., description="ISO UTC timestamp for the half-hour period")
    actual_mw: Optional[float] = Field(None, description="Actual wind generation delivered in MW")
    forecast_mw: Optional[float] = Field(None, description="Day-Ahead wind forecast in MW")
    error_mw: Optional[float] = Field(None, description="Actual minus Forecast (positive = surplus, negative = deficit)")
    forecast_publish_time: Optional[str] = Field(None, description="Timestamp when forecast was released")


class DailySummary(BaseModel):
    delivery_date: str = Field(..., description="Delivery date YYYY-MM-DD")
    cutoff_hour_utc: int = Field(..., description="Day-Ahead gate closure hour UTC")
    total_actual_mwh: float = Field(..., description="Total actual wind energy delivered (MWh)")
    total_forecast_mwh: float = Field(..., description="Total forecasted wind energy (MWh)")
    mean_absolute_error_mw: float = Field(..., description="Daily MAE in MW")
    peak_deficit_mw: float = Field(..., description="Maximum generation shortfall in a single period (MW)")
    peak_surplus_mw: float = Field(..., description="Maximum generation surplus in a single period (MW)")


class DayAheadScheduleResponse(BaseModel):
    delivery_date: str
    cutoff_hour_utc: int
    summary: DailySummary
    schedule: List[SettlementPeriodData]


class ErrorMetricsSummary(BaseModel):
    sample_count: int
    mean_absolute_error_mw: float
    root_mean_square_error_mw: float
    mean_absolute_percentage_error: float
    mean_bias_error_mw: float
    normalized_mae_percent: float
    percentiles: Dict[str, float]
    max_overforecast_mw: float
    max_underforecast_mw: float


class HistogramBin(BaseModel):
    bin_center_mw: float
    range_label: str
    frequency: int


class DiurnalPeriod(BaseModel):
    settlement_period: int
    time_label: str
    mae_mw: float
    rmse_mw: float
    bias_mw: float


class MonthlyAnalyticsResponse(BaseModel):
    cutoff_hour_utc: int
    overall_metrics: ErrorMetricsSummary
    histogram: List[HistogramBin]
    diurnal_profile: List[DiurnalPeriod]


class DailyPerformanceItem(BaseModel):
    date: str
    mae_mw: float
    rmse_mw: float
    actual_mwh: float
    forecast_mwh: float


class MonthlyDailyBreakdownResponse(BaseModel):
    cutoff_hour_utc: int
    days: List[DailyPerformanceItem]
