from backend.services.data_pipeline import market_store
from backend.services.error_metrics import get_monthly_evaluation_summary

if __name__ == "__main__":
    market_store.initialize()

    # Requirement 1: Day-Ahead purchase decision logic
    day_data = market_store.get_day_ahead_schedule("2026-01-15", cutoff_hour_utc=11)
    actual_mwh = sum(r["actual_mw"] for r in day_data if r["actual_mw"]) * 0.5
    fc_mwh = sum(r["forecast_mw"] for r in day_data if r["forecast_mw"]) * 0.5
    period_20 = day_data[19]

    print("\n========================================================")
    print(" REQUIREMENT 1: DAY-AHEAD DECISION MATCHING LOGIC")
    print("========================================================")
    print("Delivery Date:              2026-01-15")
    print("Auction Cutoff Used:        2026-01-14 11:00 UTC (Day D-1)")
    print(f"Settlement Periods Matched: {len(day_data)} / 48 periods")
    print(f"Total Forecasted Wind:      {fc_mwh:,.1f} MWh")
    print(f"Total Actual Wind:          {actual_mwh:,.1f} MWh")
    print(f"Sample Period 20 (10:00Z):  Forecast = {period_20['forecast_mw']} MW | Actual = {period_20['actual_mw']} MW | Delta = {period_20['error_mw']} MW")

    # Requirement 2: Quantitative Error Evaluation
    print("\n========================================================")
    print(" REQUIREMENT 2: QUANTITATIVE ERROR EVALUATION")
    print("========================================================")
    monthly = get_monthly_evaluation_summary(cutoff_hour_utc=11)
    metrics = monthly["overall_metrics"]
    print(f"Total Half-Hour Periods:    {metrics['sample_count']}")
    print(f"Mean Absolute Error (MAE):  {metrics['mean_absolute_error_mw']:,.1f} MW")
    print(f"Root Mean Sq Error (RMSE):  {metrics['root_mean_square_error_mw']:,.1f} MW")
    print(f"Mean Abs Pct Error (MAPE):  {metrics['mean_absolute_percentage_error']:.2f} %")
    print(f"Mean Bias Error (MBE):      +{metrics['mean_bias_error_mw']:,.1f} MW (Overforecast bias)")
    print(f"Error Histogram Bins:       {len(monthly['histogram'])} bins calculated")
    print(f"Diurnal Profile:            {len(monthly['diurnal_profile'])} periods evaluated")
    print("========================================================\n")
