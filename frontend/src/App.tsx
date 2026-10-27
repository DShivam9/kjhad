import { useState, useEffect, useRef } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

import { Sidebar, type TabType } from "@/components/layout/Sidebar"
import { DayAheadView } from "@/components/forecast/DayAheadView"
import { QuantitativeErrorView } from "@/components/analytics/QuantitativeErrorView"
import { ThermalRiskBufferView } from "@/components/decision/ThermalRiskBufferView"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"
import { apiClient } from "@/api/client"
import type { DayAheadScheduleResponse } from "@/api/types"

export function App() {
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<TabType>("day-ahead")
  const [selectedDate, setSelectedDate] = useState<string>("2026-01-15")
  const [cutoffHour, setCutoffHour] = useState<number>(11)
  const [scheduleData, setScheduleData] = useState<DayAheadScheduleResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)

  // In-memory cache for all 31 days of January to ensure 0ms instantaneous date switching
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

  // Fetch current selected date
  useEffect(() => {
    fetchSchedule(selectedDate, cutoffHour)
  }, [selectedDate, cutoffHour])

  // Background prefetch all January 2026 days to eliminate any network wait on date switching
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
            // Ignore prefetch failures in background
          }
        }
      }
    }

    prefetchJanuaryDays()
  }, [cutoffHour])

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-150 dark:bg-[#0c0c0e] dark:text-zinc-100 flex flex-row font-sans">
      {/* Expandable & Collapsible Trading Desk Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cutoffHour={cutoffHour}
        selectedDate={selectedDate}
        theme={theme}
        toggleTheme={toggleTheme}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Workspace Area with Status Footer */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 w-full max-w-7xl px-4 py-5 sm:px-6 space-y-6 mx-auto">
          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchSchedule(selectedDate, cutoffHour)}
                className="h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
              </Button>
            </div>
          )}

          {/* Tab 1: Day-Ahead Schedule & Purchase Decisions */}
          {activeTab === "day-ahead" && (
            <DayAheadView
              scheduleData={scheduleData}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              cutoffHour={cutoffHour}
              setCutoffHour={setCutoffHour}
            />
          )}

          {/* Tab 2: Quantitative Error Analytics */}
          {activeTab === "analytics" && (
            <QuantitativeErrorView cutoffHour={cutoffHour} />
          )}

          {/* Tab 3: Decision Support & Thermal Buffer Sizing */}
          {activeTab === "buffer" && (
            <ThermalRiskBufferView cutoffHour={cutoffHour} />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
