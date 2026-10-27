import { useState } from "react"
import { Shield, Gauge } from "lucide-react"

interface ThermalRiskBufferViewProps {
  cutoffHour: number
}

export function ThermalRiskBufferView({ cutoffHour }: ThermalRiskBufferViewProps) {
  const [confidenceLevel, setConfidenceLevel] = useState<number>(90)
  const [assumedDemandMw, setAssumedDemandMw] = useState<number>(26000)
  const [dayAheadWindForecastMw, setDayAheadWindForecastMw] = useState<number>(14000)

  // Quantified error thresholds based on January 2026 distribution
  const bufferLookup: Record<number, { bufferMw: number; description: string; riskLabel: string }> = {
    50: {
      bufferMw: 1666,
      description: "Covers the median historical overforecast error.",
      riskLabel: "Moderate Risk (P50 coverage)",
    },
    80: {
      bufferMw: 3250,
      description: "Protects against 8 out of 10 unexpected wind drops.",
      riskLabel: "Prudent Utility Standard (P80 coverage)",
    },
    90: {
      bufferMw: 4334,
      description: "Recommended institutional safety buffer based on January 2026 90th percentile.",
      riskLabel: "High Protection (P90 institutional standard)",
    },
    95: {
      bufferMw: 5120,
      description: "Conservative buffer guarding against severe winter storm forecast collapses.",
      riskLabel: "Maximum Defense (P95 extreme storm hedge)",
    },
  }

  const selectedPolicy = bufferLookup[confidenceLevel] || bufferLookup[90]
  const unhedgedThermalNeeded = Math.max(0, assumedDemandMw - dayAheadWindForecastMw)
  const totalHedgedProcurement = unhedgedThermalNeeded + selectedPolicy.bufferMw

  // Illustrative UK Balancing Mechanism Cashout Penalty calculation
  const illustrativeCashoutPricePerMwh = 125 // £/MWh typical peak imbalance
  const dailyExposureRiskPounds = Math.round(
    (selectedPolicy.bufferMw * 0.5 * illustrativeCashoutPricePerMwh * 4) / 1000
  ) // In thousands

  return (
    <div className="space-y-6">
      {/* Contextual Header Callout */}
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#18181b]">
        <div className="flex items-start space-x-3">
          <Shield className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
          <div className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              Decision Support: Thermal Procurement & Risk Buffer Sizing
            </h3>
            <p>
              In the UK wholesale power market, relying 1:1 on wind forecasts creates a structural shortfall risk due to the national model's{" "}
              <strong>+1,839 MW average overforecast bias</strong> during January 2026. This module calculates the empirical dispatchable thermal reserve buffer
              required to protect against costly UK Balancing Mechanism (BM) System Buy Price cashout penalties.
            </p>
          </div>
        </div>
      </section>

      {/* Main Configuration & Decision Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Policy Configuration Controls */}
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#18181b] space-y-5 lg:col-span-1">
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Procurement Risk Policy</h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              Select confidence level for Day-Ahead auction bidding (Cutoff: {cutoffHour}:00 UTC D-1)
            </p>
          </div>

          {/* Confidence Selector Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Confidence Coverage:</span>
              <span className="font-bold tabular-nums text-blue-600 dark:text-blue-400">P{confidenceLevel}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Risk Confidence Level">
              {[50, 80, 90, 95].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConfidenceLevel(level)}
                  aria-pressed={confidenceLevel === level}
                  className={`rounded-md py-1.5 text-xs font-semibold transition-colors ${
                    confidenceLevel === level
                      ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  P{level}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500">{selectedPolicy.description}</p>
          </div>

          {/* Input Controls */}
          <div className="space-y-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <div>
              <label htmlFor="consumer-demand-input" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Expected Consumer Demand (MW):
              </label>
              <input
                id="consumer-demand-input"
                name="consumerDemandMw"
                type="number"
                step={500}
                value={assumedDemandMw}
                onChange={(e) => setAssumedDemandMw(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm tabular-nums text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-[#141416] dark:text-zinc-100"
              />
            </div>

            <div>
              <label htmlFor="wind-forecast-input" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Day-Ahead Wind Forecast (MW):
              </label>
              <input
                id="wind-forecast-input"
                name="dayAheadWindForecastMw"
                type="number"
                step={500}
                value={dayAheadWindForecastMw}
                onChange={(e) => setDayAheadWindForecastMw(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm tabular-nums text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-[#141416] dark:text-zinc-100"
              />
            </div>
          </div>
        </section>

        {/* Quantified Recommendation Flow */}
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#18181b] space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Quantified Procurement Recommendation
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                Exact wholesale dispatchable power order sizes for the Day-Ahead auction
              </p>
            </div>
            <span className="rounded bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              {selectedPolicy.riskLabel}
            </span>
          </div>

          {/* 3 Step Visual Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="rounded-md border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-[#141416]">
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Step 1: Unhedged Residual</span>
              <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100 mt-1">
                {unhedgedThermalNeeded.toLocaleString()} <span className="text-xs font-normal text-zinc-500">MW</span>
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Demand ({assumedDemandMw.toLocaleString()}) − Wind ({dayAheadWindForecastMw.toLocaleString()})
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-md border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/30 dark:bg-amber-950/15">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Step 2: Recommended Buffer
              </span>
              <p className="text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                +{selectedPolicy.bufferMw.toLocaleString()} <span className="text-xs font-normal text-zinc-500">MW</span>
              </p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
                Derived from January 2026 P{confidenceLevel} error profile
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-md border border-blue-200/80 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
              <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                Step 3: Total Power Order
              </span>
              <p className="text-2xl font-semibold tabular-nums text-blue-600 dark:text-blue-400 mt-1">
                {totalHedgedProcurement.toLocaleString()} <span className="text-xs font-normal text-zinc-500">MW</span>
              </p>
              <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80 mt-1">
                Total Day-Ahead wholesale buy order
              </p>
            </div>
          </div>

          {/* Commercial Impact Calculation Box */}
          <div className="rounded-md border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-[#141416]">
            <div className="flex items-center space-x-2 mb-1.5">
              <Gauge className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Balancing Mechanism Financial Protection
              </h5>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Procuring this <strong>+{selectedPolicy.bufferMw.toLocaleString()} MW buffer</strong> in the Day-Ahead auction protects the utility from unexpected wind dropouts.
              If unhedged during peak winter demand, this deficit volume would be resolved via the National Grid System Buy Price (averaging ~£125/MWh during stress periods),
              avoiding an estimated <strong>£{dailyExposureRiskPounds.toLocaleString()}k</strong> in daily cashout penalties.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
