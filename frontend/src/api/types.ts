export interface SettlementPeriodData {
  settlement_period: number
  start_time: string
  actual_mw: number | null
  forecast_mw: number | null
  error_mw: number | null
  forecast_publish_time: string | null
}

export interface DailySummary {
  delivery_date: string
  cutoff_hour_utc: number
  total_actual_mwh: number
  total_forecast_mwh: number
  mean_absolute_error_mw: number
  peak_deficit_mw: number
  peak_surplus_mw: number
}

export interface DayAheadScheduleResponse {
  delivery_date: string
  cutoff_hour_utc: number
  summary: DailySummary
  schedule: SettlementPeriodData[]
}

export interface ErrorMetricsSummary {
  sample_count: number
  mean_absolute_error_mw: number
  root_mean_square_error_mw: number
  mean_absolute_percentage_error: number
  mean_bias_error_mw: number
  normalized_mae_percent: number
  percentiles: {
    p10: number
    p50: number
    p90: number
  }
  max_overforecast_mw: number
  max_underforecast_mw: number
}

export interface HistogramBin {
  bin_center_mw: number
  range_label: string
  frequency: number
}

export interface DiurnalPeriod {
  settlement_period: number
  time_label: string
  mae_mw: number
  rmse_mw: number
  bias_mw: number
}

export interface MonthlyAnalyticsResponse {
  cutoff_hour_utc: number
  overall_metrics: ErrorMetricsSummary
  histogram: HistogramBin[]
  diurnal_profile: DiurnalPeriod[]
}

export interface DailyPerformanceItem {
  date: string
  mae_mw: number
  rmse_mw: number
  actual_mwh: number
  forecast_mwh: number
}

export interface MonthlyDailyBreakdownResponse {
  cutoff_hour_utc: number
  days: DailyPerformanceItem[]
}
