import { useState, useEffect, useRef } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { AnimatePresence, MotionConfig, motion } from "motion/react"

import { TopNav, type TabType } from "@/components/layout/TopNav"
import { DayAheadView } from "@/components/forecast/DayAheadView"
import { QuantitativeErrorView } from "@/components/analytics/QuantitativeErrorView"
import { ThermalRiskBufferView } from "@/components/decision/ThermalRiskBufferView"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"
import { apiClient } from "@/api/client"
import type { DayAheadScheduleResponse } from "@/api/types"

const VIEW_TRANSITION = {
  duration: 0.16,
  ease: [0.23, 1, 0.32, 1] as const,
}

export function App() {
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<TabType>("day-ahead")
  const [selectedDate, setSelectedDate] = useState<string>("2026-01-15")
  const [cutoffHour, setCutoffHour] = useState<number>(11)
  const [scheduleData, setScheduleData] = useState<DayAheadScheduleResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const scheduleCacheRef = useRef<Record<string, DayAheadScheduleResponse>>({})

  const fetchSchedule = (date: string, hour: number) => {
    const cacheKey = `${date}_${hour}`
    if (scheduleCacheRef.current[cacheKey]) {
      setScheduleData(scheduleCacheRef.current[cacheKey])
      return
    }

    setErrorMessage(null)

    apiClient
      .getDayAheadSchedule(date, hour)
      .then((data) => {
        scheduleCacheRef.current[cacheKey] = data
        setScheduleData(data)
      })
      .catch((err) => {
        console.error("Failed to load Day-Ahead schedule:", err)
        setErrorMessage("Unable to connect to the backend API. Please make sure the backend service is running on port 8000.")
      })
  }

  useEffect(() => {
    fetchSchedule(selectedDate, cutoffHour)
  }, [selectedDate, cutoffHour])

  useEffect(() => {
    const prefetchJanuaryDays = async () => {
      for (let day = 1; day <= 31; day++) {
        const dayStr = day.toString().padStart(2, "0")
        const dateStr = `2026-01-${dayStr}`
        const key = `${dateStr}_${cutoffHour}`
        if (!scheduleCacheRef.current[key]) {
          try {
            const data = await apiClient.getDayAheadSchedule(dateStr, cutoffHour)
            scheduleCacheRef.current[key] = data
          } catch {
            // Ignore background prefetch errors
          }
        }
      }
    }

    prefetchJanuaryDays()
  }, [cutoffHour])

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-150 dark:bg-[#09090b] dark:text-zinc-100 flex flex-col font-sans">
        <TopNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cutoffHour={cutoffHour}
          selectedDate={selectedDate}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <main className="flex-1 w-full max-w-6xl px-5 py-6 sm:px-8 sm:py-8 space-y-8 mx-auto">
          {errorMessage && (
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchSchedule(selectedDate, cutoffHour)}
                className="h-7 text-xs active:scale-[0.96] transition-transform duration-150"
              >
                <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" /> Retry
              </Button>
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "day-ahead" && (
              <motion.div
                key="day-ahead"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={VIEW_TRANSITION}
              >
                <DayAheadView
                  scheduleData={scheduleData}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  cutoffHour={cutoffHour}
                  setCutoffHour={setCutoffHour}
                />
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={VIEW_TRANSITION}
              >
                <QuantitativeErrorView cutoffHour={cutoffHour} />
              </motion.div>
            )}

            {activeTab === "buffer" && (
              <motion.div
                key="buffer"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={VIEW_TRANSITION}
              >
                <ThermalRiskBufferView cutoffHour={cutoffHour} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </MotionConfig>
  )
}

export default App
