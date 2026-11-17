import { LineChart, BarChart3, ShieldCheck, Sun, Moon } from "lucide-react"
import { motion } from "motion/react"

export type TabType = "day-ahead" | "analytics" | "buffer"

interface TopNavProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  cutoffHour: number
  selectedDate: string
  theme: "light" | "dark"
  toggleTheme: () => void
}

const NAVIGATION_ITEMS = [
  { id: "day-ahead" as TabType, label: "Day-Ahead", icon: LineChart },
  { id: "analytics" as TabType, label: "Error Analytics", icon: BarChart3 },
  { id: "buffer" as TabType, label: "Risk Buffer", icon: ShieldCheck },
]

export function TopNav({
  activeTab,
  setActiveTab,
  cutoffHour,
  selectedDate,
  theme,
  toggleTheme,
}: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-zinc-50/80 backdrop-blur-md dark:border-white/[0.07] dark:bg-[#09090b]/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        {/* Brand */}
        <div className="flex items-center shrink-0">
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            UK Wind Forecast
          </span>
        </div>

        {/* Centered 3-Tab Segmented Navigation */}
        <nav
          aria-label="Main Navigation"
          className="glass-subtle inline-flex items-center rounded-xl p-1"
        >
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative inline-flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-[color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96] ${
                  isActive
                    ? "text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="top-nav-pill"
                    transition={{ type: "spring", duration: 0.24, bounce: 0 }}
                    className="absolute inset-0 rounded-lg bg-white border border-zinc-200/80 dark:bg-white/[0.08] dark:border-white/[0.08]"
                    aria-hidden="true"
                  />
                )}
                <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="relative z-10 whitespace-nowrap">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Right Context & Theme Toggle */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="hidden md:flex items-center space-x-2 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="tabular-nums">{selectedDate}</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span className="tabular-nums">{cutoffHour}:00 UTC</span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="glass-subtle inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition-[colors,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-zinc-900 active:scale-[0.96] dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Moon className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
