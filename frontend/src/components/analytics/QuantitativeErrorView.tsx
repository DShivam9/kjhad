import { useState, useEffect, useMemo } from "react"
import NumberFlow from "@number-flow/react"

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

  const histogramData = useMemo(() => {
    if (!analytics?.histogram) return []
    return analytics.histogram.map((bin) => ({
      name: `${bin.bin_center_mw > 0 ? "+" : ""}${(bin.bin_center_mw / 1000).toFixed(1)}k`,
      frequency: bin.frequency,
      range: bin.range_label,
    }))
  }, [analytics])

  const diurnalChartData = useMemo(() => {
    if (!analytics?.diurnal_profile) return []
    return analytics.diurnal_profile.map((item) => {
      const totalMinutes = (item.settlement_period - 1) * 30
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return {
        date: new Date(Date.UTC(2026, 0, 1, hours, minutes)),
        maeMw: Math.round(item.mae_mw),
        biasMw: Math.round(item.bias_mw),
        period: item.settlement_period,
      }
    })
  }, [analytics])

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
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            January 2026 Error Analytics
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {overall_metrics.sample_count.toLocaleString()} half-hour settlement periods · Gate closure {cutoffHour}:00 UTC D-1
          </p>
        </div>
        <span className="text-xs text-zinc-500">
          Persistent <strong className="tabular-nums text-amber-600 dark:text-amber-400">+{Math.round(overall_metrics.mean_bias_error_mw).toLocaleString()} MW</strong> overforecast bias
        </span>
      </header>

      {/* Tier 1: Glassmorphic KPI Strip */}
      <section aria-label="Monthly Error Summary" className="glass-surface rounded-2xl p-5 grid grid-cols-2 gap-y-6 lg:grid-cols-4 lg:divide-x lg:divide-zinc-200/70 dark:lg:divide-white/[0.07]">
        <div className="lg:pr-6">
          <span className="text-xs font-medium text-zinc-500">Mean Absolute Error (MAE)</span>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
            <NumberFlow value={Math.round(overall_metrics.mean_absolute_error_mw)} />{" "}
            <span className="text-xs font-normal text-zinc-500">MW</span>
          </p>
          <span className="mt-1 block text-[11px] text-zinc-400">
            {overall_metrics.normalized_mae_percent}% of peak metered capacity
          </span>
        </div>

        <div className="lg:px-6">
          <span className="text-xs font-medium text-zinc-500">Root Mean Square Error</span>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
            <NumberFlow value={Math.round(overall_metrics.root_mean_square_error_mw)} />{" "}
            <span className="text-xs font-normal text-zinc-500">MW</span>
          </p>
          <span className="mt-1 block text-[11px] text-zinc-400">Tail-risk storm sensitivity</span>
        </div>

        <div className="lg:px-6">
          <span className="text-xs font-medium text-zinc-500">Mean Absolute % Error</span>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
            <NumberFlow value={overall_metrics.mean_absolute_percentage_error} />%
          </p>
          <span className="mt-1 block text-[11px] text-zinc-400">Active wind periods (&gt;50 MW)</span>
        </div>

        <div className="lg:pl-6">
          <span className="text-xs font-medium text-zinc-500">Directional Bias (MBE)</span>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-amber-600 dark:text-amber-400">
            +<NumberFlow value={Math.round(overall_metrics.mean_bias_error_mw)} />{" "}
            <span className="text-xs font-normal text-zinc-500">MW</span>
          </p>
          <span className="mt-1 block text-[11px] text-zinc-400">Systemic overforecasting</span>
        </div>
      </section>

      {/* Tier 2: Distribution & Diurnal Charts */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Error Distribution Histogram
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Signed error (Forecast − Actual) frequency
              </p>
            </div>
            <div className="flex items-center space-x-3 text-[11px] tabular-nums text-zinc-500">
              <span>P10 {overall_metrics.percentiles.p10}</span>
              <span>P50 +{overall_metrics.percentiles.p50}</span>
              <span>P90 +{overall_metrics.percentiles.p90}</span>
            </div>
          </div>

          <div className="glass-surface rounded-2xl p-4">
            <div className="h-[260px] w-full">
              <BarChart
                data={histogramData}
                animationDuration={700}
                xDataKey="name"
                aspectRatio="2.2 / 1"
                className="h-full w-full"
              >
                <Grid horizontal vertical={false} />
                <Bar dataKey="frequency" fill="var(--chart-1)" stroke="var(--chart-1)" lineCap={3} />
                <BarXAxis />
                <ChartTooltip />
              </BarChart>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Diurnal Error Profile (48 Periods)
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Evening peak bias between 17:00 and 20:00 UTC
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-medium">
              <span className="flex items-center space-x-1.5 text-zinc-600 dark:text-zinc-300">
                <span className="h-0.5 w-3 rounded-full bg-blue-500" aria-hidden="true" />
                <span>MAE</span>
              </span>
              <span className="flex items-center space-x-1.5 text-zinc-600 dark:text-zinc-300">
                <span className="h-0.5 w-3 rounded-full bg-amber-500" aria-hidden="true" />
                <span>Bias</span>
              </span>
            </div>
          </div>

          <div className="glass-surface rounded-2xl p-4">
            <div className="h-[260px] w-full">
              <AreaChart
                data={diurnalChartData}
                animationDuration={750}
                animationEasing="cubic-bezier(0.23, 1, 0.32, 1)"
                aspectRatio="2.2 / 1"
                className="h-full w-full"
              >
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
          </div>
        </div>
      </section>

      {/* Tier 3: 31-Day Trend + Peak Storm Days Strip */}
      <section className="space-y-4 border-t border-zinc-200/80 pt-6 dark:border-zinc-800/80">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Daily Forecast Error · January 2026 (Days 1–31)
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Daily MAE progression highlighting winter storm divergence
            </p>
          </div>
          <span className="text-xs tabular-nums text-zinc-400">Cutoff {cutoffHour}:00 UTC D-1</span>
        </div>

        <div className="glass-surface rounded-2xl p-4">
          <div className="h-[230px] w-full">
            <AreaChart
              data={dailyChartData}
              animationDuration={750}
              animationEasing="cubic-bezier(0.23, 1, 0.32, 1)"
              aspectRatio="3.2 / 1"
              className="h-full w-full"
            >
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
        </div>

        <div className="pt-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Highest Volatility Storm Days
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:divide-x sm:divide-zinc-200/80 dark:sm:divide-zinc-800/80">
            {highestVolatilityDays.map((d, index) => (
              <div key={d.date} className={index > 0 ? "sm:pl-4" : ""}>
                <span className="text-xs font-mono text-zinc-500">{d.date}</span>
                <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {Math.round(d.mae_mw).toLocaleString()} <span className="text-xs font-normal text-zinc-500">MW MAE</span>
                </p>
                <p className="mt-0.5 text-[11px] tabular-nums text-zinc-400">
                  {Math.round(d.actual_mwh / 1000)}k actual vs {Math.round(d.forecast_mwh / 1000)}k fcst
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
