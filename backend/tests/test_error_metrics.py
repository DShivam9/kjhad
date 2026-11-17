from backend.services.error_metrics import calculate_metrics_from_pairs


def test_calculate_metrics_hand_calculated_values():
    # Signed errors (forecast - actual): [10.0, -20.0]
    actual = [100.0, 200.0]
    forecast = [110.0, 180.0]

    result = calculate_metrics_from_pairs(actual, forecast)

    assert result["sample_count"] == 2
    assert result["mean_absolute_error_mw"] == 15.0
    assert result["root_mean_square_error_mw"] == 15.81  # sqrt((100 + 400) / 2)
    assert result["mean_absolute_percentage_error"] == 10.0  # mean(10/100, 20/200) * 100
    assert result["mean_bias_error_mw"] == -5.0
    assert result["max_overforecast_mw"] == 10.0
    assert result["max_underforecast_mw"] == -20.0


def test_calculate_metrics_empty_input():
    result = calculate_metrics_from_pairs([], [])

    assert result["sample_count"] == 0
    assert result["mean_absolute_error_mw"] == 0.0
    assert result["root_mean_square_error_mw"] == 0.0
    assert result["mean_absolute_percentage_error"] == 0.0
    assert result["mean_bias_error_mw"] == 0.0
    assert result["percentiles"] == {"p10": 0.0, "p50": 0.0, "p90": 0.0}


def test_calculate_metrics_single_period():
    result = calculate_metrics_from_pairs([100.0], [120.0])

    assert result["sample_count"] == 1
    assert result["mean_absolute_error_mw"] == 20.0
    assert result["root_mean_square_error_mw"] == 20.0
    assert result["mean_absolute_percentage_error"] == 20.0
    assert result["mean_bias_error_mw"] == 20.0
    assert result["percentiles"] == {"p10": 20.0, "p50": 20.0, "p90": 20.0}


def test_calculate_metrics_mape_skips_zero_actuals():
    # Period 1 (actual=0) must be skipped by MAPE, while MAE/MBE include both periods
    actual = [0.0, 100.0]
    forecast = [50.0, 120.0]

    result = calculate_metrics_from_pairs(actual, forecast)

    assert result["sample_count"] == 2
    assert result["mean_absolute_error_mw"] == 35.0
    assert result["mean_bias_error_mw"] == 35.0
    assert result["mean_absolute_percentage_error"] == 20.0


def test_calculate_metrics_all_zero_actuals_mape_is_zero():
    result = calculate_metrics_from_pairs([0.0, 0.0], [10.0, 20.0])

    assert result["sample_count"] == 2
    assert result["mean_absolute_error_mw"] == 15.0
    assert result["mean_bias_error_mw"] == 15.0
    assert result["mean_absolute_percentage_error"] == 0.0


def test_calculate_metrics_perfect_forecasts():
    actual = [100.0, 250.0]
    forecast = [100.0, 250.0]

    result = calculate_metrics_from_pairs(actual, forecast)

    assert result["sample_count"] == 2
    assert result["mean_absolute_error_mw"] == 0.0
    assert result["root_mean_square_error_mw"] == 0.0
    assert result["mean_absolute_percentage_error"] == 0.0
    assert result["mean_bias_error_mw"] == 0.0
    assert result["normalized_mae_percent"] == 0.0
    assert result["percentiles"] == {"p10": 0.0, "p50": 0.0, "p90": 0.0}
