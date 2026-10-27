interface LoadingStateProps {
  title: string
  description: string
  subtext?: string
}

export function LoadingState({
  title,
  description,
  subtext = "Elexon BMRS Stream • 48 Periods / Day • Zero Look-Ahead Bias",
}: LoadingStateProps) {
  return (
    <div className="flex min-h-[72vh] w-full items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-[#18181b] space-y-4">
        {/* Sleek Neutral Spinner */}
        <div className="relative mx-auto flex h-10 w-10 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-200" />
        </div>

        {/* Text Content */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Sleek Indeterminate Progress Bar */}
        <div className="mx-auto h-1 w-48 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/80">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-zinc-700 dark:bg-zinc-300" />
        </div>

        {/* Technical Subtext */}
        <p className="pt-2 font-mono text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/60">
          {subtext}
        </p>
      </div>
    </div>
  )
}
