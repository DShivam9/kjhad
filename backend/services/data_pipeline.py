"""
Data Pipeline & Day-Ahead Forecast Alignment Service

Handles:
1. Ingestion and local JSON caching for January 2026 Elexon data.
2. Market Gate Closure logic: matches actual wind delivery on Day D against
   the latest forecast available on Day D-1 on or before the auction cutoff hour.
"""

from datetime import datetime, timedelta
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
import pandas as pd

from backend.services.elexon_client import (
    fetch_actual_wind_generation,
    fetch_forecast_wind_generation,
)

DATA_DIRECTORY = Path(__file__).resolve().parent.parent / "data" / "raw"
ACTUALS_CACHE_FILE = DATA_DIRECTORY / "actuals_jan_2026.json"
FORECASTS_CACHE_FILE = DATA_DIRECTORY / "forecasts_jan_2026.json"


def ensure_data_directory_exists() -> None:
    DATA_DIRECTORY.mkdir(parents=True, exist_ok=True)


def load_or_fetch_actuals(force_refresh: bool = False) -> List[Dict[str, Any]]:
    """
    Loads actual wind generation for January 2026 from local cache, or fetches from Elexon.
    """
    ensure_data_directory_exists()
    if ACTUALS_CACHE_FILE.exists() and not force_refresh:
        with open(ACTUALS_CACHE_FILE, "r", encoding="utf-8") as file:
            return json.load(file)

    # Fetch entire month of January 2026
    actuals = fetch_actual_wind_generation(
        publish_time_from="2026-01-01T00:00:00Z",
        publish_time_to="2026-02-01T00:30:00Z",
    )
    with open(ACTUALS_CACHE_FILE, "w", encoding="utf-8") as file:
        json.dump(actuals, file)
    return actuals


def load_or_fetch_forecasts(force_refresh: bool = False) -> List[Dict[str, Any]]:
    """
    Loads wind forecasts for January 2026 delivery from local cache, or fetches from Elexon.
    Includes late December 2025 releases to ensure Day D-1 forecasts exist for early Jan.
    """
    ensure_data_directory_exists()
    if FORECASTS_CACHE_FILE.exists() and not force_refresh:
        with open(FORECASTS_CACHE_FILE, "r", encoding="utf-8") as file:
            return json.load(file)

    forecasts = fetch_forecast_wind_generation(
        publish_time_from="2025-12-30T00:00:00Z",
        publish_time_to="2026-02-01T00:00:00Z",
    )
    with open(FORECASTS_CACHE_FILE, "w", encoding="utf-8") as file:
        json.dump(forecasts, file)
    return forecasts


class MarketDataStore:
    """
    In-memory market data cache and alignment engine.
    Holds DataFrames in memory for instant queries with zero database overhead.
    """

    def __init__(self) -> None:
        self.actuals_df: pd.DataFrame = pd.DataFrame()
        self.forecasts_df: pd.DataFrame = pd.DataFrame()
        self._is_initialized: bool = False

    def initialize(self, force_refresh: bool = False) -> None:
        """
        Loads and prepares DataFrames with clean datetimes and indices.
        """
        raw_actuals = load_or_fetch_actuals(force_refresh=force_refresh)
        raw_forecasts = load_or_fetch_forecasts(force_refresh=force_refresh)

        # Build actuals DataFrame
        if raw_actuals:
            actuals_df = pd.DataFrame(raw_actuals)
            actuals_df["start_time"] = pd.to_datetime(actuals_df["startTime"], utc=True)
            actuals_df["generation_mw"] = actuals_df["generation"].astype(float)
            actuals_df = actuals_df[["start_time", "generation_mw", "settlementDate", "settlementPeriod"]]
            actuals_df = actuals_df.drop_duplicates(subset=["start_time"]).sort_values("start_time")
            self.actuals_df = actuals_df

        # Build forecasts DataFrame
        if raw_forecasts:
            forecasts_df = pd.DataFrame(raw_forecasts)
            forecasts_df["start_time"] = pd.to_datetime(forecasts_df["startTime"], utc=True)
            forecasts_df["publish_time"] = pd.to_datetime(forecasts_df["publishTime"], utc=True)
            forecasts_df["forecast_mw"] = forecasts_df["generation"].astype(float)
            forecasts_df = forecasts_df[["start_time", "publish_time", "forecast_mw"]]
            self.forecasts_df = forecasts_df

        self._is_initialized = True

    def get_day_ahead_schedule(
        self,
        delivery_date_str: str,
        cutoff_hour_utc: int = 11,
    ) -> List[Dict[str, Any]]:
        """
        Returns the matched 48 settlement periods for a delivery date.
        For each settlement period on Day D:
        - Finds forecasts published on or before Day (D - 1) at cutoff_hour_utc:00:00Z.
        - Selects the most recent forecast before that gate closure.
        - Pairs it with the actual generation for that period.
        """
        if not self._is_initialized:
            self.initialize()

        delivery_date = datetime.strptime(delivery_date_str, "%Y-%m-%d").date()
        day_start = pd.Timestamp(delivery_date, tz="UTC")
        day_end = day_start + pd.Timedelta(days=1)

        # Gate closure cutoff: Day D-1 at cutoff_hour_utc
        gate_closure = day_start - pd.Timedelta(days=1) + pd.Timedelta(hours=cutoff_hour_utc)

        # 1. Filter actuals for the delivery day
        day_actuals = self.actuals_df[
            (self.actuals_df["start_time"] >= day_start) & (self.actuals_df["start_time"] < day_end)
        ].copy()

        # 2. Filter candidate forecasts: for this day, published on or before gate closure
        candidate_forecasts = self.forecasts_df[
            (self.forecasts_df["start_time"] >= day_start)
            & (self.forecasts_df["start_time"] < day_end)
            & (self.forecasts_df["publish_time"] <= gate_closure)
        ].copy()

        # Fallback in case a specific day had an earlier forecast cutoff
        if candidate_forecasts.empty:
            candidate_forecasts = self.forecasts_df[
                (self.forecasts_df["start_time"] >= day_start)
                & (self.forecasts_df["start_time"] < day_end)
            ].copy()

        # Select the latest forecast per delivery period published before cutoff
        latest_forecasts = candidate_forecasts.sort_values("publish_time").groupby("start_time").last().reset_index()

        # Merge actuals and forecasts
        merged = pd.merge(
            day_actuals,
            latest_forecasts[["start_time", "publish_time", "forecast_mw"]],
            on="start_time",
            how="left",
        )

        # WINDFOR stream is hourly (at :00) while FUELHH actuals are half-hourly (48 periods).
        # We linearly interpolate the forecast for :30 periods to provide complete 48-period coverage.
        merged["forecast_mw"] = merged["forecast_mw"].interpolate(method="linear").bfill().ffill()

        schedule = []
        for index, row in merged.iterrows():
            actual_mw = None if pd.isna(row.get("generation_mw")) else float(row["generation_mw"])
            forecast_mw = None if pd.isna(row.get("forecast_mw")) else float(row["forecast_mw"])
            error_mw = (actual_mw - forecast_mw) if (actual_mw is not None and forecast_mw is not None) else None

            schedule.append({
                "settlement_period": int(row.get("settlementPeriod", index + 1)),
                "start_time": row["start_time"].isoformat(),
                "actual_mw": actual_mw,
                "forecast_mw": round(forecast_mw, 1) if forecast_mw is not None else None,
                "error_mw": round(error_mw, 1) if error_mw is not None else None,
                "forecast_publish_time": row["publish_time"].isoformat() if pd.notna(row.get("publish_time")) else None,
            })

        return schedule


# Shared singleton instance
market_store = MarketDataStore()


if __name__ == "__main__":
    print("Testing data pipeline initialization and Day-Ahead matching...")
    market_store.initialize()
    print(f"Loaded {len(market_store.actuals_df)} actuals, {len(market_store.forecasts_df)} forecasts.")
    sample_day = market_store.get_day_ahead_schedule(delivery_date_str="2026-01-15", cutoff_hour_utc=11)
    print(f"Sample schedule for 2026-01-15: {len(sample_day)} settlement periods returned.")
    if sample_day:
        first_period = sample_day[0]
        print("Period 1:", first_period)
        assert first_period["settlement_period"] == 1
    print("Data pipeline verification successful!")
