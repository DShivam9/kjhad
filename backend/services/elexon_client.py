"""
Elexon BMRS API Client

Fetches wholesale electricity generation and forecast data for the UK market:
- Actual Wind Generation: FUELHH dataset (fuelType="WIND")
- Forecast Wind Generation: WINDFOR dataset
"""

import json
import time
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"


def fetch_dataset_stream(
    dataset_name: str,
    publish_time_from: str,
    publish_time_to: str,
    additional_params: Optional[Dict[str, str]] = None,
    max_retries: int = 3,
    timeout_seconds: int = 30,
) -> List[Dict[str, Any]]:
    """
    Fetches raw streaming records from the Elexon BMRS API with exponential retry.
    """
    query_params = {
        "publishDateTimeFrom": publish_time_from,
        "publishDateTimeTo": publish_time_to,
    }
    if additional_params:
        query_params.update(additional_params)

    query_string = "&".join(f"{key}={value}" for key, value in query_params.items())
    request_url = f"{ELEXON_BASE_URL}/{dataset_name}/stream?{query_string}"

    for attempt in range(1, max_retries + 1):
        try:
            request = urllib.request.Request(
                request_url,
                headers={"User-Agent": "UK-Wind-Procurement-App/1.0", "Accept": "application/json"},
            )
            with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
                payload = json.loads(response.read().decode("utf-8"))
                if isinstance(payload, list):
                    return payload
                elif isinstance(payload, dict) and "data" in payload:
                    return payload["data"]
                return []
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            if attempt == max_retries:
                raise RuntimeError(
                    f"Failed to fetch {dataset_name} after {max_retries} attempts: {error}"
                ) from error
            time.sleep(1.5 * attempt)

    return []


def fetch_actual_wind_generation(
    publish_time_from: str,
    publish_time_to: str,
) -> List[Dict[str, Any]]:
    """
    Fetches half-hourly actual wind generation (FUELHH dataset, fuelType=WIND).
    """
    records = fetch_dataset_stream(
        dataset_name="FUELHH",
        publish_time_from=publish_time_from,
        publish_time_to=publish_time_to,
    )
    # Filter strictly for wind generation
    return [record for record in records if record.get("fuelType") == "WIND"]


def fetch_forecast_wind_generation(
    publish_time_from: str,
    publish_time_to: str,
) -> List[Dict[str, Any]]:
    """
    Fetches wind generation forecasts (WINDFOR dataset).
    """
    return fetch_dataset_stream(
        dataset_name="WINDFOR",
        publish_time_from=publish_time_from,
        publish_time_to=publish_time_to,
    )


if __name__ == "__main__":
    # Quick runnable self-check for a 12-hour window in January 2026
    print("Testing Elexon API connection...")
    actuals = fetch_actual_wind_generation(
        publish_time_from="2026-01-01T00:00:00Z",
        publish_time_to="2026-01-01T12:00:00Z",
    )
    forecasts = fetch_forecast_wind_generation(
        publish_time_from="2026-01-01T00:00:00Z",
        publish_time_to="2026-01-01T12:00:00Z",
    )
    print(f"Self-check passed: {len(actuals)} wind actuals, {len(forecasts)} forecasts fetched.")
    assert len(actuals) > 0, "Expected at least one actuals record"
    assert len(forecasts) > 0, "Expected at least one forecast record"
