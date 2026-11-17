import json
from datetime import datetime, timedelta, timezone
import pandas as pd

from backend.services import data_pipeline
from backend.services.data_pipeline import MarketDataStore


def _make_actuals_df(delivery_date: str, generation_mw: float = 5000.0) -> pd.DataFrame:
    base = datetime.fromisoformat(delivery_date).replace(tzinfo=timezone.utc)
    rows = []
    for period in range(1, 49):
        start = base + timedelta(minutes=30 * (period - 1))
        rows.append({
            "start_time": pd.Timestamp(start),
            "generation_mw": generation_mw,
            "settlementDate": delivery_date,
            "settlementPeriod": period,
        })
    return pd.DataFrame(rows)


def _make_forecasts_df(entries: list[tuple[str, str, float]]) -> pd.DataFrame:
    rows = [
        {
            "start_time": pd.Timestamp(start_iso),
            "publish_time": pd.Timestamp(publish_iso),
            "forecast_mw": forecast_mw,
        }
        for start_iso, publish_iso, forecast_mw in entries
    ]
    return pd.DataFrame(rows)


def test_forecast_published_after_cutoff_is_excluded():
    store = MarketDataStore()
    store.actuals_df = _make_actuals_df("2026-01-15", generation_mw=5000.0)
    store.forecasts_df = _make_forecasts_df([
        ("2026-01-15T00:00:00Z", "2026-01-14T10:00:00Z", 1000.0),
        ("2026-01-15T00:00:00Z", "2026-01-14T11:30:00Z", 9999.0),  # after 11:00 UTC on D-1
    ])
    store._is_initialized = True

    schedule = store.get_day_ahead_schedule("2026-01-15", cutoff_hour_utc=11)

    assert schedule[0]["forecast_mw"] == 1000.0
    assert schedule[0]["forecast_publish_time"] == "2026-01-14T10:00:00+00:00"


def test_forecast_published_at_exact_cutoff_is_kept():
    store = MarketDataStore()
    store.actuals_df = _make_actuals_df("2026-01-15", generation_mw=5000.0)
    store.forecasts_df = _make_forecasts_df([
        ("2026-01-15T00:00:00Z", "2026-01-14T09:00:00Z", 1500.0),
        ("2026-01-15T00:00:00Z", "2026-01-14T11:00:00Z", 2500.0),  # exact cutoff
    ])
    store._is_initialized = True

    schedule = store.get_day_ahead_schedule("2026-01-15", cutoff_hour_utc=11)

    assert schedule[0]["forecast_mw"] == 2500.0


def test_latest_valid_forecast_before_cutoff_wins():
    store = MarketDataStore()
    store.actuals_df = _make_actuals_df("2026-01-15", generation_mw=5000.0)
    store.forecasts_df = _make_forecasts_df([
        ("2026-01-15T00:00:00Z", "2026-01-14T06:00:00Z", 1200.0),
        ("2026-01-15T00:00:00Z", "2026-01-14T10:30:00Z", 1800.0),
    ])
    store._is_initialized = True

    schedule = store.get_day_ahead_schedule("2026-01-15", cutoff_hour_utc=11)

    assert schedule[0]["forecast_mw"] == 1800.0


def test_no_pre_cutoff_forecasts_does_not_leak_future_forecasts():
    store = MarketDataStore()
    store.actuals_df = _make_actuals_df("2026-01-15", generation_mw=5000.0)
    # Only a post-cutoff forecast exists (published after D-1 11:00 UTC)
    store.forecasts_df = _make_forecasts_df([
        ("2026-01-15T00:00:00Z", "2026-01-14T15:00:00Z", 4200.0),
    ])
    store._is_initialized = True

    schedule = store.get_day_ahead_schedule("2026-01-15", cutoff_hour_utc=11)

    assert schedule[0]["forecast_mw"] is None
    assert schedule[0]["forecast_publish_time"] is None


def test_hourly_forecasts_interpolated_to_48_half_hour_periods():
    store = MarketDataStore()
    store.actuals_df = _make_actuals_df("2026-01-15", generation_mw=5000.0)

    # Hourly forecasts only (:00), increasing by 100 MW each hour: 1000, 1100, ..., 3300
    hourly_entries = [
        (f"2026-01-15T{hour:02d}:00:00Z", "2026-01-14T10:00:00Z", 1000.0 + hour * 100.0)
        for hour in range(24)
    ]
    store.forecasts_df = _make_forecasts_df(hourly_entries)
    store._is_initialized = True

    schedule = store.get_day_ahead_schedule("2026-01-15", cutoff_hour_utc=11)

    assert len(schedule) == 48
    assert schedule[0]["forecast_mw"] == 1000.0  # 00:00
    assert schedule[1]["forecast_mw"] == 1050.0  # 00:30 midpoint between 1000 and 1100
    assert schedule[2]["forecast_mw"] == 1100.0  # 01:00
    assert schedule[46]["forecast_mw"] == 3300.0  # 23:00
    assert schedule[47]["forecast_mw"] == 3300.0  # 23:30 forward-filled from 23:00


def test_load_or_fetch_uses_cache_without_network(tmp_path, monkeypatch):
    actuals_file = tmp_path / "actuals.json"
    forecasts_file = tmp_path / "forecasts.json"
    actuals_file.write_text(json.dumps([{"startTime": "2026-01-15T00:00:00Z", "generation": 100}]), encoding="utf-8")
    forecasts_file.write_text(json.dumps([{"startTime": "2026-01-15T00:00:00Z", "publishTime": "2026-01-14T10:00:00Z", "generation": 120}]), encoding="utf-8")

    monkeypatch.setattr(data_pipeline, "DATA_DIRECTORY", tmp_path)
    monkeypatch.setattr(data_pipeline, "ACTUALS_CACHE_FILE", actuals_file)
    monkeypatch.setattr(data_pipeline, "FORECASTS_CACHE_FILE", forecasts_file)

    def fail_network(*args, **kwargs):
        raise AssertionError("Network fetch must not be called when cache exists")

    monkeypatch.setattr(data_pipeline, "fetch_actual_wind_generation", fail_network)
    monkeypatch.setattr(data_pipeline, "fetch_forecast_wind_generation", fail_network)

    actuals = data_pipeline.load_or_fetch_actuals()
    forecasts = data_pipeline.load_or_fetch_forecasts()

    assert len(actuals) == 1
    assert actuals[0]["generation"] == 100
    assert len(forecasts) == 1
    assert forecasts[0]["generation"] == 120
