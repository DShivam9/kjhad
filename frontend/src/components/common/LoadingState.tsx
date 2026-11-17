import { motion } from "motion/react"

interface LoadingStateProps {
  title: string
  description: string
  subtext?: string
}

export function LoadingState({
  title,
  description,
  subtext = "Elexon BMRS · 48 Periods · Zero Look-Ahead Bias",
}: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-8 py-2"
    >
      {/* Minimal unboxed status header */}
      <div className="flex flex-col items-start justify-between gap-2 border-b border-zinc-200/70 pb-5 sm:flex-row sm:items-center dark:border-white/[0.07]">
        <div className="flex items-center space-x-3">
          <div
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-[1.5px] border-zinc-300 border-t-zinc-900 dark:border-white/15 dark:border-t-zinc-100"
          />
          <div>
            <h2 className="text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
              {title}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
          </div>
        </div>

        <span className="font-mono text-[10px] tracking-wide text-zinc-400 dark:text-zinc-500">
          {subtext}
        </span>
      </div>

      {/* Quiet spatial skeleton matching the dashboard layout */}
      <div className="glass-surface rounded-2xl p-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2.5">
            <div className="h-3 w-20 animate-pulse rounded bg-zinc-200/70 dark:bg-white/[0.06]" />
            <div className="h-7 w-28 animate-pulse rounded bg-zinc-200/90 dark:bg-white/[0.08]" />
            <div className="h-2.5 w-24 animate-pulse rounded bg-zinc-200/50 dark:bg-white/[0.04]" />
          </div>
        ))}
      </div>

      <div className="glass-surface rounded-2xl p-5">
        <div className="h-[340px] w-full animate-pulse rounded-xl bg-zinc-200/40 dark:bg-white/[0.025]" />
      </div>
    </motion.div>
  )
}
