import { 
  LineChart, 
  BarChart3, 
  ShieldCheck, 
  PanelLeftClose, 
  PanelLeft, 
  Sun, 
  Moon
} from "lucide-react"

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
  const navigationItems = [
    {
      id: "day-ahead" as TabType,
      label: "Day-Ahead View",
      sublabel: "Forecast vs Metered",
      icon: LineChart,
    },
    {
      id: "analytics" as TabType,
      label: "Error Analytics",
      sublabel: "MAE, RMSE & MBE (Jan '26)",
      icon: BarChart3,
    },
    {
      id: "buffer" as TabType,
      label: "Risk Buffer Sizing",
      sublabel: "P50–P95 Reserve Sizing",
      icon: ShieldCheck,
    },
  ]

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col justify-between border-r border-zinc-200 bg-white transition-all duration-200 ease-in-out dark:border-zinc-800 dark:bg-[#111113] shrink-0 z-30 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      aria-label="Trading Desk Navigation"
    >
      {/* Top Brand & Collapse Header */}
      <div>
        <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-3.5 dark:border-zinc-800">
          {!isCollapsed ? (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                GRID<span className="text-zinc-400 dark:text-zinc-500">/</span>WIND
              </span>
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] font-medium text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400">
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
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-transparent text-zinc-500 transition-colors hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-800 dark:hover:bg-[#18181b] dark:hover:text-zinc-100"
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Navigation Item List */}
        <nav className="p-2 space-y-1" aria-label="Main Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? `${item.label} (${item.sublabel})` : undefined}
                className={`w-full flex items-center rounded-md transition-colors text-left ${
                  isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2 space-x-3"
                } ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 font-semibold dark:bg-[#1e1e23] dark:text-zinc-100 shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#161619] dark:hover:text-zinc-200"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"
                  }`}
                  aria-hidden="true"
                />

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
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

      {/* Bottom Operational Metadata & Controls */}
      <div className="border-t border-zinc-200 p-2.5 dark:border-zinc-800 space-y-2.5">
        {!isCollapsed && (
          <div className="rounded-md border border-zinc-200/80 bg-zinc-50/70 p-2.5 font-mono text-[11px] text-zinc-600 dark:border-zinc-800/80 dark:bg-[#141416] dark:text-zinc-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-zinc-400 dark:text-zinc-500">Gate Closure</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{cutoffHour}:00 UTC D-1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-zinc-400 dark:text-zinc-500">Delivery Date</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedDate}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 dark:text-zinc-500">Periods</span>
              <span>48 Half-Hours</span>
            </div>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={isCollapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
          className={`w-full flex items-center justify-center rounded-md border border-zinc-200 bg-white py-1.5 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-[#161619] dark:text-zinc-300 dark:hover:bg-[#1e1e23] ${
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
