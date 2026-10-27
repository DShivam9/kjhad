import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"

import { AreaChart } from "@/components/charts/area-chart"
import { Area } from "@/components/charts/area"
import { Grid } from "@/components/charts/grid"
import { XAxis } from "@/components/charts/x-axis"
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip"
import { LoadingState } from "@/components/common/LoadingState"
import type { DayAheadScheduleResponse } from "@/api/types"

interface DayAheadViewProps {
  scheduleData: DayAheadScheduleResponse | null
  selectedDate: string
  setSelectedDate: (date: string) => void
  cutoffHour: number
  setCutoffHour: (hour: number) => void
}

export function DayAheadView({
  scheduleData,
  selectedDate,
  setSelectedDate,
  cutoffHour,
  setCutoffHour,
}: DayAheadViewProps) {
  const [customerDemandMw, setCustomerDemandMw] = useState<number>(25000)

  // Navigate through January 2026 days
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

  // Format data specifically for Bklit time-series engine
  const chartData = useMemo(() => {
    if (!scheduleData?.schedule) return []
    return scheduleData.schedule.map((item) => {
      return {
        date: new Date(item.start_time),
        actualMw: item.actual_mw ?? 0,
        forecastMw: item.forecast_mw ?? 0,
        period: item.settlement_period,
      }
    })
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
  const thermalNeededMw = Math.max(0, customerDemandMw - (summary.total_forecast_mwh / 24))

  return (
    <div className="space-y-6">
      {/* Date & Gate Closure Header Bar */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrevDay}
            disabled={currentDayNumber <= 1}
            aria-label="Previous Delivery Day"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
            className="h-8 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-[#18181b] dark:text-zinc-100"
          >
            {Array.from({ length: 31 }, (_, index) => {
              const dayStr = (index + 1).toString().padStart(2, "0")
              const dateVal = `2026-01-${dayStr}`
              return (
                <option key={dateVal} value={dateVal}>
                  Delivery Date: {dateVal} (Day {index + 1})
                </option>
              )
            })}
          </select>

          <button
            type="button"
            onClick={handleNextDay}
            disabled={currentDayNumber >= 31}
            aria-label="Next Delivery Day"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Gate Closure Cutoff Selector */}
        <div className="flex items-center space-x-2 text-xs text-zinc-500">
          <span>Day-Ahead Auction Cutoff:</span>
          <div className="inline-flex rounded-md border border-zinc-200 p-0.5 dark:border-zinc-800 dark:bg-[#141416]">
            {[9, 11, 12, 14].map((hour) => (
              <button
                key={hour}
                type="button"
                onClick={() => setCutoffHour(hour)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  cutoffHour === hour
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {hour}:00 UTC {hour === 11 && "(Default)"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Chart Section: Bklit Visualization */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Day-Ahead Wind Forecast vs Actual Generation (48 Settlement Periods)
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Available forecast at {cutoffHour}:00 UTC on Day D-1 compared to actual national delivery
            </p>
          </div>

          {/* Clean Legend - Technical Line Swatches (No glowing dots) */}
          <div className="flex items-center space-x-4 text-xs font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="h-0.5 w-3 rounded-sm bg-emerald-500" aria-hidden="true" />
              <span className="text-zinc-700 dark:text-zinc-300">Actual Delivered (MW)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-0.5 w-3 rounded-sm bg-blue-500" aria-hidden="true" />
              <span className="text-zinc-700 dark:text-zinc-300">Day-Ahead Forecast (MW)</span>
            </div>
          </div>
        </div>

        {/* Bklit Chart Container */}
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#18181b]">
          <div className="h-[360px] w-full">
            <AreaChart data={chartData} animationDuration={0} aspectRatio="2.6 / 1" className="h-full w-full">
              <Grid horizontal vertical={false} />
              <XAxis />
              {/* Actual Wind Generation - Soft Sage Line with Subtle Tint */}
              <Area
                dataKey="actualMw"
                fill="var(--chart-positive)"
                stroke="var(--chart-positive)"
                strokeWidth={1.75}
                fillOpacity={0.08}
              />
              {/* Day-Ahead Forecast - Clean Blue Line */}
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

      {/* Clean 4-Column Metric Table (Tabular Numbers, Minimalist Soft Charcoal) */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#18181b]">
          <span className="text-xs text-zinc-500">Total Forecast Wind</span>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {Math.round(summary.total_forecast_mwh).toLocaleString()} <span className="text-xs font-normal text-zinc-500">MWh</span>
          </p>
          <span className="text-[11px] text-zinc-400">Day D-1 estimate</span>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#18181b]">
          <span className="text-xs text-zinc-500">Actual Wind Delivered</span>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {Math.round(summary.total_actual_mwh).toLocaleString()} <span className="text-xs font-normal text-zinc-500">MWh</span>
          </p>
          <span className="text-[11px] text-zinc-400">Metered by Elexon</span>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#18181b]">
          <span className="text-xs text-zinc-500">Mean Absolute Error (MAE)</span>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {summary.mean_absolute_error_mw.toLocaleString()} <span className="text-xs font-normal text-zinc-500">MW</span>
          </p>
          <span className="text-[11px] text-zinc-400">Daily average deviation</span>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#18181b]">
          <span className="text-xs text-zinc-500">Peak Single-Period Deficit</span>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
            {summary.peak_deficit_mw.toLocaleString()} <span className="text-xs font-normal text-zinc-500">MW</span>
          </p>
          <span className="text-[11px] text-zinc-400">Maximum shortfall risk</span>
        </div>
      </section>

      {/* Procurement Decision Module */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#18181b] space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Day-Ahead Wholesale Procurement Decision
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Determine how much dispatchable thermal power needs to be bought in the Day-Ahead auction to serve customer load.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Demand Slider Input */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="customer-demand-slider" className="font-medium text-zinc-700 dark:text-zinc-300">
                Utility Customer Demand:
              </label>
              <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {customerDemandMw.toLocaleString()} MW
              </span>
            </div>
            <input
              id="customer-demand-slider"
              type="range"
              min={15000}
              max={40000}
              step={500}
              value={customerDemandMw}
              onChange={(e) => setCustomerDemandMw(parseInt(e.target.value, 10))}
              className="w-full accent-zinc-900 dark:accent-zinc-100"
            />
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>15,000 MW</span>
              <span>25,000 MW (Standard)</span>
              <span>40,000 MW</span>
            </div>
          </div>

          {/* Net Thermal Power to Buy */}
          <div className="rounded-md bg-zinc-50 p-4 border border-zinc-200/60 dark:bg-[#141416] dark:border-zinc-800">
            <span className="text-xs text-zinc-500">Average Thermal Power to Buy:</span>
            <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100 mt-1">
              {Math.round(thermalNeededMw).toLocaleString()} <span className="text-xs font-normal text-zinc-500">MW</span>
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Net Residual = Demand ({customerDemandMw.toLocaleString()}) - Wind ({Math.round(summary.total_forecast_mwh / 24).toLocaleString()})
            </p>
          </div>

          {/* Operational Guidance */}
          <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
            <div className="flex items-center space-x-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
              <AlertCircle className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <span>Balancing Mechanism Warning</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              With a peak wind shortfall of <strong>{summary.peak_deficit_mw.toLocaleString()} MW</strong>, buying exactly the net forecast leaves the utility vulnerable to cashout penalties. Procure an intraday safety margin on thermal units.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
