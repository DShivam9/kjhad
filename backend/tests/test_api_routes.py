import pandas as pd
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services import data_pipeline
from backend.services.data_pipeline import market_store


@pytest.fixture()
def client(monkeypatch):
    def fail_network(*args, **kwargs):
        raise AssertionError("Live Elexon API must not be called during tests")

    monkeypatch.setattr(data_pipeline, "fetch_actual_wind_generation", fail_network)
    monkeypatch.setattr(data_pipeline, "fetch_forecast_wind_generation", fail_network)

    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint_returns_healthy_status(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert body["market_data_initialized"] is True
    assert body["actuals_count"] > 0
    assert body["forecasts_count"] > 0
    assert body["period"] == "January 2026"


def test_day_ahead_forecast_valid_date_returns_200_and_shape(client):
    response = client.get("/api/forecast/day-ahead", params={"delivery_date": "2026-01-15", "cutoff_hour": 11})

    assert response.status_code == 200
    body = response.json()
    assert body["delivery_date"] == "2026-01-15"
    assert body["cutoff_hour_utc"] == 11
    assert set(body["summary"].keys()) == {
        "delivery_date",
        "cutoff_hour_utc",
        "total_actual_mwh",
        "total_forecast_mwh",
        "mean_absolute_error_mw",
        "peak_deficit_mw",
        "peak_surplus_mw",
    }
    assert len(body["schedule"]) == 48
    first = body["schedule"][0]
    assert first["settlement_period"] == 1
    assert set(first.keys()) == {
        "settlement_period",
        "start_time",
        "actual_mw",
        "forecast_mw",
        "error_mw",
        "forecast_publish_time",
    }


@pytest.mark.parametrize("bad_date", ["2026-02-01", "2025-12-31", "not-a-date", "2026-01-32"])
def test_day_ahead_forecast_invalid_or_out_of_range_date_returns_422(client, bad_date):
    response = client.get("/api/forecast/day-ahead", params={"delivery_date": bad_date})

    assert response.status_code == 422


@pytest.mark.parametrize("bad_cutoff", [-1, 24])
def test_day_ahead_forecast_invalid_cutoff_hour_returns_422(client, bad_cutoff):
    response = client.get(
        "/api/forecast/day-ahead",
        params={"delivery_date": "2026-01-15", "cutoff_hour": bad_cutoff},
    )

    assert response.status_code == 422


def test_day_ahead_forecast_missing_data_returns_404(client, monkeypatch):
    empty_actuals = pd.DataFrame(columns=["start_time", "generation_mw", "settlementDate", "settlementPeriod"])
    empty_forecasts = pd.DataFrame(columns=["start_time", "publish_time", "forecast_mw"])
    monkeypatch.setattr(market_store, "actuals_df", empty_actuals)
    monkeypatch.setattr(market_store, "forecasts_df", empty_forecasts)

    response = client.get("/api/forecast/day-ahead", params={"delivery_date": "2026-01-15"})

    assert response.status_code == 404


def test_analytics_monthly_summary_returns_200_and_shape(client):
    response = client.get("/api/analytics/monthly-summary", params={"cutoff_hour": 11})

    assert response.status_code == 200
    body = response.json()
    assert body["cutoff_hour_utc"] == 11
    assert body["overall_metrics"]["sample_count"] > 1400
    assert len(body["histogram"]) == 25
    assert len(body["diurnal_profile"]) == 48
    assert body["diurnal_profile"][0]["settlement_period"] == 1
    assert body["diurnal_profile"][-1]["settlement_period"] == 48


def test_analytics_daily_breakdown_returns_200_and_31_days(client):
    response = client.get("/api/analytics/daily-breakdown", params={"cutoff_hour": 11})

    assert response.status_code == 200
    body = response.json()
    assert body["cutoff_hour_utc"] == 11
    assert len(body["days"]) == 31
    assert body["days"][0]["date"] == "2026-01-01"
    assert body["days"][-1]["date"] == "2026-01-31"


@pytest.mark.parametrize("endpoint", ["/api/analytics/monthly-summary", "/api/analytics/daily-breakdown"])
def test_analytics_invalid_cutoff_hour_returns_422(client, endpoint):
    response = client.get(endpoint, params={"cutoff_hour": 99})

    assert response.status_code == 422
