import {
  LineChart,
  BarChart3,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
} from "lucide-react"
import { motion } from "motion/react"

export type TabType = "day-ahead" | "analytics" | "buffer"

interface SidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  cutoffHour: number
  selectedDate: string
  theme: "light" | "dark"
  toggleTheme: () => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void
}

const NAVIGATION_ITEMS = [
  {
    id: "day-ahead" as TabType,
    label: "Day-Ahead View",
    sublabel: "Forecast vs Metered",
    icon: LineChart,
  },
  {
    id: "analytics" as TabType,
    label: "Error Analytics",
    sublabel: "MAE, RMSE & MBE",
    icon: BarChart3,
  },
  {
    id: "buffer" as TabType,
    label: "Risk Buffer Sizing",
    sublabel: "P50–P95 Reserve",
    icon: ShieldCheck,
  },
]

export function Sidebar({
  activeTab,
  setActiveTab,
  cutoffHour,
  selectedDate,
  theme,
  toggleTheme,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col justify-between border-r border-zinc-200/70 bg-white/75 backdrop-blur-xl transition-[width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] dark:border-white/[0.07] dark:bg-[#0e0e11]/80 shrink-0 z-30 ${
        isCollapsed ? "w-16" : "w-60"
      }`}
      aria-label="Trading Desk Navigation"
    >
      <div>
        <div className="flex h-14 items-center justify-between border-b border-zinc-200/70 px-3.5 dark:border-white/[0.07]">
          {!isCollapsed ? (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                GRID<span className="text-zinc-400 dark:text-zinc-500">/</span>WIND
              </span>
              <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] font-medium text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
                BMRS
              </span>
            </div>
          ) : (
            <div className="mx-auto font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
              G<span className="text-zinc-400 dark:text-zinc-500">/</span>W
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-[colors,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.96] dark:text-zinc-400 dark:hover:bg-[#18181b] dark:hover:text-zinc-100"
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <nav className="p-2 space-y-1" aria-label="Main Navigation">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? `${item.label} (${item.sublabel})` : undefined}
                className={`relative w-full flex items-center rounded-lg text-left transition-[color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] ${
                  isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5 space-x-3"
                } ${
                  isActive
                    ? "text-zinc-900 font-medium dark:text-zinc-100"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    transition={{ type: "spring", duration: 0.25, bounce: 0 }}
                    className="glass-subtle absolute inset-0 rounded-lg"
                    aria-hidden="true"
                  />
                )}

                <Icon
                  className={`relative z-10 h-4 w-4 shrink-0 ${
                    isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"
                  }`}
                  aria-hidden="true"
                />

                {!isCollapsed && (
                  <div className="relative z-10 flex-1 min-w-0">
                    <p className="text-xs leading-none">{item.label}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 truncate">
                      {item.sublabel}
                    </p>
                  </div>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-zinc-200/70 p-3 dark:border-white/[0.07] space-y-2.5">
        {!isCollapsed && (
          <div className="glass-subtle rounded-xl p-2.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Cutoff</span>
              <span className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">{cutoffHour}:00 UTC D-1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Date</span>
              <span className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">{selectedDate}</span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={isCollapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
          className={`glass-subtle w-full flex items-center justify-center rounded-xl py-2 text-xs text-zinc-700 transition-[colors,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-zinc-100/80 active:scale-[0.96] dark:text-zinc-300 dark:hover:bg-white/[0.06] ${
            isCollapsed ? "px-0" : "px-3 space-x-2"
          }`}
        >
          {theme === "dark" ? (
            <Sun className="h-3.5 w-3.5 text-zinc-300 shrink-0" aria-hidden="true" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-zinc-600 shrink-0" aria-hidden="true" />
          )}
          {!isCollapsed && (
            <span className="text-xs font-medium">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}
