import { useState } from "react"
import { Gauge } from "lucide-react"
import NumberFlow from "@number-flow/react"
import { motion } from "motion/react"

interface ThermalRiskBufferViewProps {
  cutoffHour: number
}

const BUFFER_LOOKUP: Record<number, { bufferMw: number; description: string; riskLabel: string }> = {
  50: {
    bufferMw: 1666,
    description: "Covers the median historical overforecast error.",
    riskLabel: "P50 · Moderate Risk",
  },
  80: {
    bufferMw: 3250,
    description: "Protects against 8 out of 10 unexpected wind drops.",
    riskLabel: "P80 · Prudent Standard",
  },
  90: {
    bufferMw: 4334,
    description: "Recommended institutional buffer based on January 2026 90th percentile.",
    riskLabel: "P90 · Institutional Standard",
  },
  95: {
    bufferMw: 5120,
    description: "Conservative hedge guarding against severe winter storm collapses.",
    riskLabel: "P95 · Extreme Storm Hedge",
  },
}

const CONFIDENCE_LEVELS = [50, 80, 90, 95]

export function ThermalRiskBufferView({ cutoffHour }: ThermalRiskBufferViewProps) {
  const [confidenceLevel, setConfidenceLevel] = useState<number>(90)
  const [assumedDemandMw, setAssumedDemandMw] = useState<number>(26000)
  const [dayAheadWindForecastMw, setDayAheadWindForecastMw] = useState<number>(14000)

  const selectedPolicy = BUFFER_LOOKUP[confidenceLevel] || BUFFER_LOOKUP[90]
  const unhedgedThermalNeeded = Math.max(0, assumedDemandMw - dayAheadWindForecastMw)
  const totalHedgedProcurement = unhedgedThermalNeeded + selectedPolicy.bufferMw

  const illustrativeCashoutPricePerMwh = 125
  const dailyExposureRiskPounds = Math.round(
    (selectedPolicy.bufferMw * 0.5 * illustrativeCashoutPricePerMwh * 4) / 1000
  )

  const totalSupplyStack = Math.max(1, dayAheadWindForecastMw + totalHedgedProcurement)
  const windSharePct = (dayAheadWindForecastMw / totalSupplyStack) * 100
  const residualSharePct = (unhedgedThermalNeeded / totalSupplyStack) * 100
  const bufferSharePct = (selectedPolicy.bufferMw / totalSupplyStack) * 100

  return (
    <div className="space-y-8">
      <header className="border-b border-zinc-200/70 pb-5 dark:border-white/[0.07]">
        <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Thermal Procurement &amp; Risk Buffer Sizing
        </h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">
          Compensate for the <strong className="text-zinc-700 dark:text-zinc-300">+1,839 MW average overforecast bias</strong> in January 2026 by sizing empirical thermal reserves ahead of the {cutoffHour}:00 UTC D-1 auction.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Policy & Load Inputs */}
        <section className="glass-surface rounded-2xl p-6 lg:col-span-4 space-y-6">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Confidence Coverage</span>
              <span className="font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                {selectedPolicy.riskLabel}
              </span>
            </div>

            <div className="glass-subtle grid grid-cols-4 gap-1 rounded-xl p-1" role="group" aria-label="Risk Confidence Level">
              {CONFIDENCE_LEVELS.map((level) => {
                const isSelected = confidenceLevel === level
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setConfidenceLevel(level)}
                    aria-pressed={isSelected}
                    className={`relative rounded-lg py-1.5 text-xs font-semibold transition-[color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96] ${
                      isSelected
                        ? "text-white dark:text-zinc-900"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="confidence-pill"
                        transition={{ type: "spring", duration: 0.25, bounce: 0 }}
                        className="absolute inset-0 rounded-lg bg-zinc-900 dark:bg-zinc-100"
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative z-10 tabular-nums">P{level}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">{selectedPolicy.description}</p>
          </div>

          <div className="space-y-4 border-t border-zinc-200/70 pt-5 dark:border-white/[0.07]">
            <div>
              <label htmlFor="consumer-demand-input" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Expected Consumer Demand (MW)
              </label>
              <input
                id="consumer-demand-input"
                name="consumerDemandMw"
                type="number"
                step={500}
                value={assumedDemandMw}
                onChange={(e) => setAssumedDemandMw(parseInt(e.target.value, 10) || 0)}
                className="glass-subtle w-full rounded-xl px-3 py-2 text-sm tabular-nums text-zinc-900 transition-colors focus:border-zinc-400 focus:outline-none dark:text-zinc-100"
              />
            </div>

            <div>
              <label htmlFor="wind-forecast-input" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Day-Ahead Wind Forecast (MW)
              </label>
              <input
                id="wind-forecast-input"
                name="dayAheadWindForecastMw"
                type="number"
                step={500}
                value={dayAheadWindForecastMw}
                onChange={(e) => setDayAheadWindForecastMw(parseInt(e.target.value, 10) || 0)}
                className="glass-subtle w-full rounded-xl px-3 py-2 text-sm tabular-nums text-zinc-900 transition-colors focus:border-zinc-400 focus:outline-none dark:text-zinc-100"
              />
            </div>
          </div>
        </section>

        {/* Right Column: Quantified Recommendation Flow */}
        <section className="glass-surface rounded-2xl p-6 lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:divide-x sm:divide-zinc-200/70 dark:sm:divide-white/[0.07]">
            <div className="sm:pr-5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                1 · Unhedged Residual
              </span>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                <NumberFlow value={unhedgedThermalNeeded} />{" "}
                <span className="text-xs font-normal text-zinc-500">MW</span>
              </p>
              <p className="mt-1 text-[11px] tabular-nums text-zinc-400">
                {assumedDemandMw.toLocaleString()} − {dayAheadWindForecastMw.toLocaleString()} MW
              </p>
            </div>

            <div className="sm:px-5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
                2 · Risk Buffer
              </span>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                +<NumberFlow value={selectedPolicy.bufferMw} />{" "}
                <span className="text-xs font-normal text-zinc-500">MW</span>
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">
                Jan 2026 P{confidenceLevel} quantile
              </p>
            </div>

            <div className="sm:pl-5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
                3 · Total Order
              </span>
              <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-blue-600 dark:text-blue-400">
                <NumberFlow value={totalHedgedProcurement} />{" "}
                <span className="text-xs font-normal text-zinc-500">MW</span>
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">
                Day-Ahead thermal buy
              </p>
            </div>
          </div>

          {/* Visual Supply Stack Bar */}
          <div className="space-y-2.5 border-t border-zinc-200/70 pt-5 dark:border-white/[0.07]">
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Hedged Supply Stack Composition</span>
              <span className="tabular-nums">{totalSupplyStack.toLocaleString()} MW total coverage</span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-white/[0.05]">
              <motion.div
                className="h-full bg-emerald-500/80"
                animate={{ width: `${windSharePct}%` }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              />
              <motion.div
                className="h-full bg-blue-500/85"
                animate={{ width: `${residualSharePct}%` }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              />
              <motion.div
                className="h-full bg-amber-500/90"
                animate={{ width: `${bufferSharePct}%` }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
              <span className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500/80" aria-hidden="true" />
                <span>Wind Forecast ({Math.round(windSharePct)}%)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500/85" aria-hidden="true" />
                <span>Base Thermal ({Math.round(residualSharePct)}%)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500/90" aria-hidden="true" />
                <span>P{confidenceLevel} Reserve ({Math.round(bufferSharePct)}%)</span>
              </span>
            </div>
          </div>

          <div className="glass-subtle rounded-xl p-4 space-y-1.5">
            <div className="flex items-center space-x-2">
              <Gauge className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Balancing Mechanism Financial Protection
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              Procuring this <strong className="tabular-nums text-zinc-700 dark:text-zinc-300">+{selectedPolicy.bufferMw.toLocaleString()} MW</strong> reserve ahead of gate closure shields the desk from National Grid System Buy Price spikes (~£125/MWh), avoiding an estimated{" "}
              <strong className="tabular-nums text-emerald-600 dark:text-emerald-400">£{dailyExposureRiskPounds.toLocaleString()}k</strong> in daily cashout penalties during peak stress periods.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
