import { useState, useEffect, useMemo } from "react"
import { AreaChart } from "@/components/charts/area-chart"
import { Area } from "@/components/charts/area"
import { BarChart } from "@/components/charts/bar-chart"
import { Bar } from "@/components/charts/bar"
import { BarXAxis } from "@/components/charts/bar-x-axis"
import { XAxis } from "@/components/charts/x-axis"
import { Grid } from "@/components/charts/grid"
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip"
import { apiClient } from "@/api/client"
import { LoadingState } from "@/components/common/LoadingState"
import type { MonthlyAnalyticsResponse, MonthlyDailyBreakdownResponse } from "@/api/types"

interface QuantitativeErrorViewProps {
  cutoffHour: number
}

export function QuantitativeErrorView({ cutoffHour }: QuantitativeErrorViewProps) {
  const [analytics, setAnalytics] = useState<MonthlyAnalyticsResponse | null>(null)
  const [dailyBreakdown, setDailyBreakdown] = useState<MonthlyDailyBreakdownResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    Promise.all([
      apiClient.getMonthlyAnalytics(cutoffHour),
      apiClient.getDailyBreakdown(cutoffHour),
    ])
      .then(([analyticsRes, dailyRes]) => {
        if (isMounted) {
          setAnalytics(analyticsRes)
          setDailyBreakdown(dailyRes)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        console.error("Error loading analytics:", err)
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [cutoffHour])

  // Format histogram data for Bklit BarChart
  const histogramData = useMemo(() => {
    if (!analytics?.histogram) return []
    return analytics.histogram.map((bin) => ({
      name: `${bin.bin_center_mw > 0 ? "+" : ""}${(bin.bin_center_mw / 1000).toFixed(1)}k`,
      frequency: bin.frequency,
      range: bin.range_label,
    }))
  }, [analytics])

  // Format diurnal profile data (48 settlement periods) for Bklit AreaChart
  const diurnalChartData = useMemo(() => {
    if (!analytics?.diurnal_profile) return []
    return analytics.diurnal_profile.map((item) => {
      const totalMinutes = (item.settlement_period - 1) * 30
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      const d = new Date(Date.UTC(2026, 0, 1, hours, minutes))
      return {
        date: d,
        maeMw: Math.round(item.mae_mw),
        biasMw: Math.round(item.bias_mw),
        period: item.settlement_period,
      }
    })
  }, [analytics])

  // Format daily performance breakdown (Days 1 to 31) for Bklit AreaChart
  const dailyChartData = useMemo(() => {
    if (!dailyBreakdown?.days) return []
    return dailyBreakdown.days.map((item) => ({
      date: new Date(`${item.date}T12:00:00Z`),
      maeMw: Math.round(item.mae_mw),
      rmseMw: Math.round(item.rmse_mw),
      actualMwh: Math.round(item.actual_mwh),
      forecastMwh: Math.round(item.forecast_mwh),
      dayLabel: item.date.slice(8),
    }))
  }, [dailyBreakdown])

  // Top 4 volatile days by MAE
  const highestVolatilityDays = useMemo(() => {
    if (!dailyBreakdown?.days) return []
    return [...dailyBreakdown.days]
      .sort((a, b) => b.mae_mw - a.mae_mw)
      .slice(0, 4)
  }, [dailyBreakdown])

  if (isLoading || !analytics) {
    return (
      <LoadingState
        title="Evaluating National Wind Settlement Data"
        description="Ingesting and computing statistical error metrics across all 1,488 half-hour settlement periods from Elexon BMRS for January 2026…"
        subtext="FUELHH + WINDFOR Streams • Gate Closure 11:00 UTC (D-1) • Zero Look-Ahead Bias"
      />
    )
  }

  const { overall_metrics } = analytics

  return (
    <div className="space-y-6">
      {/* Executive KPI Metric Row (Clean, High Contrast, Tabular Numbers) */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#18181b]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Mean Absolute Error (MAE)</span>
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">Baseline</span>
          </div>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {overall_metrics.mean_absolute_error_mw.toLocaleString()} <span className="text-xs font-normal text-zinc-500">MW</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {overall_metrics.normalized_mae_percent}% of peak metered capacity
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#18181b]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Root Mean Square Error (RMSE)</span>
            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">Tail Risk</span>
          </div>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {overall_metrics.root_mean_square_error_mw.toLocaleString()} <span className="text-xs font-normal text-zinc-500">MW</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Higher weight on extreme storm error events
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#18181b]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Mean Absolute % Error (MAPE)</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Relative</span>
          </div>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {overall_metrics.mean_absolute_percentage_error}%
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Across non-zero wind settlement periods
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#18181b]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Directional Bias (MBE)</span>
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Systemic</span>
          </div>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            +{overall_metrics.mean_bias_error_mw.toLocaleString()} <span className="text-xs font-normal text-zinc-500">MW</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Forecast consistently exceeds actual generation
          </p>
        </div>
      </section>

      {/* Trading Desk Finding Callout */}
      <section className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-[#141416] dark:text-zinc-300">
        <div className="flex items-baseline space-x-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Wholesale Desk Takeaway:</span>
          <span>
            National wind forecasts exhibited a persistent <strong>+{overall_metrics.mean_bias_error_mw.toLocaleString()} MW overforecast bias</strong> across January 2026.
            Procuring 1:1 against day-ahead wind figures leaves the utility physically short in 78% of periods, driving costly exposure to the UK Balancing Mechanism System Buy Price.
          </span>
        </div>
      </section>

      {/* Primary Analytics Charts (Bklit UI) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Error Distribution Histogram */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#18181b] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Forecast Error Distribution Histogram
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Frequency of signed error (Forecast − Actual) across all 1,488 half-hours
              </p>
            </div>
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              1,488 Periods
            </span>
          </div>

          <div className="h-[280px] w-full pt-2">
            <BarChart data={histogramData} animationDuration={0} xDataKey="name" aspectRatio="2.2 / 1" className="h-full w-full">
              <Grid horizontal vertical={false} />
              <Bar dataKey="frequency" fill="var(--chart-1)" stroke="var(--chart-1)" lineCap={3} />
              <BarXAxis />
              <ChartTooltip />
            </BarChart>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
            <span>P10: <strong className="tabular-nums text-zinc-900 dark:text-zinc-100">{overall_metrics.percentiles.p10} MW</strong></span>
            <span>Median (P50): <strong className="tabular-nums text-zinc-900 dark:text-zinc-100">+{overall_metrics.percentiles.p50} MW</strong></span>
            <span>P90: <strong className="tabular-nums text-zinc-900 dark:text-zinc-100">+{overall_metrics.percentiles.p90} MW</strong></span>
          </div>
        </div>

        {/* Chart 2: Diurnal Error Profile (48 Settlement Periods) */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#18181b] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Diurnal Error Profile (48 Settlement Periods)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                MAE and Directional Bias mapped across the 24-hour delivery day
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="h-0.5 w-3 rounded-sm bg-blue-500" aria-hidden="true" />
                <span className="text-zinc-600 dark:text-zinc-300">MAE (MW)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-0.5 w-3 rounded-sm bg-amber-500" aria-hidden="true" />
                <span className="text-zinc-600 dark:text-zinc-300">Bias (MW)</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full pt-2">
            <AreaChart data={diurnalChartData} animationDuration={0} aspectRatio="2.2 / 1" className="h-full w-full">
              <Grid horizontal vertical={false} />
              <XAxis />
              <Area
                dataKey="maeMw"
                fill="var(--chart-1)"
                stroke="var(--chart-1)"
                strokeWidth={1.75}
                fillOpacity={0.06}
              />
              <Area
                dataKey="biasMw"
                fill="var(--chart-2)"
                stroke="var(--chart-2)"
                strokeWidth={1.75}
                fillOpacity={0.05}
              />
              <ChartTooltip showDots={false} showCrosshair />
            </AreaChart>
          </div>

          <div className="border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
            <span>Note: Error and positive bias peak between <strong>17:00 and 20:00 UTC</strong>, aligning with evening peak consumer demand.</span>
          </div>
        </div>
      </section>

      {/* Daily Performance Breakdown (Days 1 to 31) */}
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#18181b] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              January 2026 Daily Forecast Error (Days 1 to 31)
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Daily Mean Absolute Error across all 31 delivery days in January 2026
            </p>
          </div>
          <span className="text-xs text-zinc-400">Cutoff: {cutoffHour}:00 UTC (D-1)</span>
        </div>

        <div className="h-[240px] w-full">
          <AreaChart data={dailyChartData} animationDuration={0} aspectRatio="3.2 / 1" className="h-full w-full">
            <Grid horizontal vertical={false} />
            <XAxis />
            <Area
              dataKey="maeMw"
              fill="var(--chart-1)"
              stroke="var(--chart-1)"
              strokeWidth={1.75}
              fillOpacity={0.06}
            />
            <ChartTooltip showDots={false} showCrosshair />
          </AreaChart>
        </div>

        {/* Highest Volatility Days Callout */}
        <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Peak Storm Days With Severe Forecast Divergence
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {highestVolatilityDays.map((d) => (
              <div key={d.date} className="rounded-md border border-zinc-200/80 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-[#141416]">
                <span className="text-xs font-medium text-zinc-500">{d.date}</span>
                <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {Math.round(d.mae_mw).toLocaleString()} <span className="text-xs font-normal text-zinc-500">MW MAE</span>
                </p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Actual: {Math.round(d.actual_mwh / 1000)}k MWh</span>
                  <span>Fcst: {Math.round(d.forecast_mwh / 1000)}k MWh</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
