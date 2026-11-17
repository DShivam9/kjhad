import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import NumberFlow from "@number-flow/react"
import { motion } from "motion/react"

import { AreaChart } from "@/components/charts/area-chart"
import { Area } from "@/components/charts/area"
import { Grid } from "@/components/charts/grid"
import { XAxis } from "@/components/charts/x-axis"
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip"
import { LoadingState } from "@/components/common/LoadingState"
import { PhysicalSlider } from "@/components/ui/physical-slider"
import type { DayAheadScheduleResponse } from "@/api/types"

interface DayAheadViewProps {
  scheduleData: DayAheadScheduleResponse | null
  selectedDate: string
  setSelectedDate: (date: string) => void
  cutoffHour: number
  setCutoffHour: (hour: number) => void
}

const CUTOFF_HOURS = [9, 11, 12, 14]

export function DayAheadView({
  scheduleData,
  selectedDate,
  setSelectedDate,
  cutoffHour,
  setCutoffHour,
}: DayAheadViewProps) {
  const [customerDemandMw, setCustomerDemandMw] = useState<number>(25000)

  const currentDayNumber = parseInt(selectedDate.split("-")[2], 10)

  const handlePrevDay = () => {
    if (currentDayNumber > 1) {
      const prev = (currentDayNumber - 1).toString().padStart(2, "0")
      setSelectedDate(`2026-01-${prev}`)
    }
  }

  const handleNextDay = () => {
    if (currentDayNumber < 31) {
      const next = (currentDayNumber + 1).toString().padStart(2, "0")
      setSelectedDate(`2026-01-${next}`)
    }
  }

  const chartData = useMemo(() => {
    if (!scheduleData?.schedule) return []
    return scheduleData.schedule.map((item) => ({
      date: new Date(item.start_time),
      actualMw: item.actual_mw ?? 0,
      forecastMw: item.forecast_mw ?? 0,
      period: item.settlement_period,
    }))
  }, [scheduleData])

  if (!scheduleData) {
    return (
      <LoadingState
        title="Loading Day-Ahead Market Schedule"
        description="Ingesting metered wind generation and latest gate-closure forecast from Elexon BMRS for this delivery day…"
        subtext="48 Settlement Periods (30-min resolution) • Cutoff 11:00 UTC D-1"
      />
    )
  }

  const { summary } = scheduleData
  const averageForecastWindMw = Math.round(summary.total_forecast_mwh / 24)
  const thermalNeededMw = Math.max(0, customerDemandMw - averageForecastWindMw)

  return (
    <div className="space-y-8">
      {/* Top Control Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrevDay}
            disabled={currentDayNumber <= 1}
            aria-label="Previous Delivery Day"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-[colors,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-zinc-100 active:scale-[0.96] disabled:opacity-35 disabled:pointer-events-none dark:border-zinc-800 dark:bg-[#141416] dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <label htmlFor="delivery-date-select" className="sr-only">
            Select Delivery Date
          </label>
          <select
            id="delivery-date-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-[#141416] dark:text-zinc-100"
          >
            {Array.from({ length: 31 }, (_, index) => {
              const dayStr = (index + 1).toString().padStart(2, "0")
              const dateVal = `2026-01-${dayStr}`
              return (
                <option key={dateVal} value={dateVal}>
                  {dateVal} · Day {index + 1}
                </option>
              )
            })}
          </select>

          <button
            type="button"
            onClick={handleNextDay}
            disabled={currentDayNumber >= 31}
            aria-label="Next Delivery Day"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-[colors,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-zinc-100 active:scale-[0.96] disabled:opacity-35 disabled:pointer-events-none dark:border-zinc-800 dark:bg-[#141416] dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Concentric Segmented Cutoff Selector */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-zinc-500 hidden sm:inline">Gate Closure (D-1)</span>
          <div className="inline-flex rounded-xl border border-zinc-200/80 bg-zinc-100/70 p-1 dark:border-zinc-800 dark:bg-[#141416]">
            {CUTOFF_HOURS.map((hour) => {
              const isSelected = cutoffHour === hour
              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => setCutoffHour(hour)}
                  className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-[color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96] ${
                    isSelected
                      ? "text-white dark:text-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="cutoff-pill"
                      transition={{ type: "spring", duration: 0.28, bounce: 0 }}
                      className="absolute inset-0 rounded-lg bg-zinc-900 dark:bg-zinc-100"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10 tabular-nums">
                    {hour}:00 UTC{hour === 11 ? " · Default" : ""}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Tier 1: Glassmorphic Executive Metric Strip */}
      <section aria-label="Daily Settlement Summary" className="glass-surface rounded-2xl p-5 grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:divide-x sm:divide-zinc-200/70 dark:sm:divide-white/[0.07]">
        <div className="sm:pr-6">
          <span className="text-xs font-medium text-zinc-500">Actual Delivered</span>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
            <NumberFlow value={Math.round(summary.total_actual_mwh)} />{" "}
            <span className="text-xs font-normal text-zinc-500">MWh</span>
          </p>
          <span className="mt-1 block text-[11px] text-zinc-400">Metered Elexon FUELHH</span>
        </div>

        <div className="sm:px-6">
          <span className="text-xs font-medium text-zinc-500">Day-Ahead Forecast</span>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
            <NumberFlow value={Math.round(summary.total_forecast_mwh)} />{" "}
            <span className="text-xs font-normal text-zinc-500">MWh</span>
          </p>
          <span className="mt-1 block text-[11px] text-zinc-400">Locked at {cutoffHour}:00 UTC D-1</span>
        </div>

        <div className="sm:px-6">
          <span className="text-xs font-medium text-zinc-500">Mean Absolute Error</span>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
            <NumberFlow value={Math.round(summary.mean_absolute_error_mw)} />{" "}
            <span className="text-xs font-normal text-zinc-500">MW</span>
          </p>
          <span className="mt-1 block text-[11px] text-zinc-400">Average half-hour miss</span>
        </div>

        <div className="sm:pl-6">
          <span className="text-xs font-medium text-zinc-500">Peak Deficit</span>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-red-600 dark:text-red-400">
            <NumberFlow value={Math.round(summary.peak_deficit_mw)} />{" "}
            <span className="text-xs font-normal text-zinc-500">MW</span>
          </p>
          <span className="mt-1 block text-[11px] text-zinc-400">Max single-period shortfall</span>
        </div>
      </section>

      {/* Tier 2: Focal Chart Canvas */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Day-Ahead Wind Forecast vs Actual Generation
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              48 settlement periods · {cutoffHour}:00 UTC D-1 forecast compared to metered delivery
            </p>
          </div>

          <div className="flex items-center space-x-5 text-xs font-medium">
            <div className="flex items-center space-x-2">
              <span className="h-0.5 w-3.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="text-zinc-700 dark:text-zinc-300">Actual (MW)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-0.5 w-3.5 rounded-full bg-blue-500" aria-hidden="true" />
              <span className="text-zinc-700 dark:text-zinc-300">Forecast (MW)</span>
            </div>
          </div>
        </div>

        <div className="glass-surface overflow-hidden rounded-2xl p-5">
          <div className="h-[360px] w-full">
            <AreaChart
              data={chartData}
              animationDuration={750}
              animationEasing="cubic-bezier(0.23, 1, 0.32, 1)"
              aspectRatio="2.6 / 1"
              className="h-full w-full"
            >
              <Grid horizontal vertical={false} />
              <XAxis />
              <Area
                dataKey="actualMw"
                fill="var(--chart-positive)"
                stroke="var(--chart-positive)"
                strokeWidth={1.75}
                fillOpacity={0.08}
              />
              <Area
                dataKey="forecastMw"
                fill="var(--chart-1)"
                stroke="var(--chart-1)"
                strokeWidth={1.75}
                fillOpacity={0.04}
              />
              <ChartTooltip showDots={false} showCrosshair />
            </AreaChart>
          </div>
        </div>
      </section>

      {/* Tier 3: Wholesale Procurement Action Strip */}
      <section className="glass-surface rounded-2xl p-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Wholesale Thermal Residual
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Adjust expected utility load to size Day-Ahead dispatchable thermal buy volume.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs">
                <label htmlFor="customer-demand-slider" className="font-medium text-zinc-700 dark:text-zinc-300">
                  Utility Customer Demand
                </label>
                <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {customerDemandMw.toLocaleString()} MW
                </span>
              </div>
              <PhysicalSlider
                id="customer-demand-slider"
                min={15000}
                max={40000}
                step={500}
                value={customerDemandMw}
                onChange={setCustomerDemandMw}
                ariaLabel="Utility Customer Demand in MW"
              />
              <div className="flex justify-between text-[11px] tabular-nums text-zinc-400">
                <span>15,000 MW</span>
                <span>25,000 MW</span>
                <span>40,000 MW</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:border-l sm:border-zinc-200/80 sm:pl-8 dark:sm:border-zinc-800/80">
            <div className="shrink-0">
              <span className="text-xs font-medium text-zinc-500">Thermal Power to Buy</span>
              <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
                <NumberFlow value={Math.round(thermalNeededMw)} />{" "}
                <span className="text-xs font-normal text-zinc-500">MW</span>
              </p>
              <p className="mt-1 text-[11px] tabular-nums text-zinc-400">
                {customerDemandMw.toLocaleString()} MW load − {averageForecastWindMw.toLocaleString()} MW avg wind
              </p>
            </div>

            <div className="space-y-1.5 text-xs max-w-sm">
              <div className="flex items-center space-x-1.5 font-medium text-zinc-900 dark:text-zinc-100">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                <span>Balancing Mechanism Risk</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">
                Peak shortfall hits <strong className="tabular-nums text-zinc-700 dark:text-zinc-300">{summary.peak_deficit_mw.toLocaleString()} MW</strong>. Buying 1:1 on raw forecast exposes the desk to System Buy Price cashout penalties.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
