import type {
  DayAheadScheduleResponse,
  MonthlyAnalyticsResponse,
  MonthlyDailyBreakdownResponse,
} from "./types"

const API_BASE = import.meta.env.VITE_API_URL || ""

async function request<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export const apiClient = {
  getDayAheadSchedule: (deliveryDate: string, cutoffHour: number = 11) =>
    request<DayAheadScheduleResponse>(
      `/api/forecast/day-ahead?delivery_date=${deliveryDate}&cutoff_hour=${cutoffHour}`
    ),

  getMonthlyAnalytics: (cutoffHour: number = 11) =>
    request<MonthlyAnalyticsResponse>(
      `/api/analytics/monthly-summary?cutoff_hour=${cutoffHour}`
    ),

  getDailyBreakdown: (cutoffHour: number = 11) =>
    request<MonthlyDailyBreakdownResponse>(
      `/api/analytics/daily-breakdown?cutoff_hour=${cutoffHour}`
    ),
}
