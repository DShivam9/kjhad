import { useRef, useState } from "react"
import { motion } from "motion/react"

interface PhysicalSliderProps {
  id?: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  ariaLabel?: string
}

export function PhysicalSlider({
  id,
  min,
  max,
  step,
  value,
  onChange,
  ariaLabel,
}: PhysicalSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [dragPercent, setDragPercent] = useState<number | null>(null)

  const snappedPercent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  const displayPercent = isDragging && dragPercent !== null ? dragPercent : snappedPercent

  const updateFromClientX = (clientX: number) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    setDragPercent(ratio * 100)

    const rawValue = min + ratio * (max - min)
    const stepped = Math.round(rawValue / step) * step
    const clamped = Math.min(max, Math.max(min, stepped))
    if (clamped !== value) {
      onChange(clamped)
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    updateFromClientX(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    updateFromClientX(e.clientX)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setIsDragging(false)
    setDragPercent(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault()
      onChange(Math.min(max, value + step))
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault()
      onChange(Math.max(min, value - step))
    }
  }

  return (
    <div
      id={id}
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      className="relative flex h-10 w-full cursor-pointer touch-none select-none items-center rounded-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
    >
      {/* Track (expands slightly on hover/drag for tactile feedback) */}
      <motion.div
        animate={{ height: isDragging || isHovered ? 8 : 6 }}
        transition={{ type: "spring", duration: 0.2, bounce: 0 }}
        className="relative w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/[0.08]"
      >
        <motion.div
          className="h-full w-full origin-left rounded-full bg-zinc-900 dark:bg-zinc-100"
          animate={{ scaleX: displayPercent / 100 }}
          transition={
            isDragging
              ? { duration: 0 }
              : { type: "spring", stiffness: 420, damping: 32 }
          }
        />
      </motion.div>

      {/* Physical Thumb (x/y handled by Motion so scale never breaks centering) */}
      <motion.div
        className="pointer-events-none absolute top-1/2 h-4 w-4 rounded-full border border-zinc-300 bg-white dark:border-zinc-900 dark:bg-zinc-100"
        initial={false}
        animate={{
          left: `${displayPercent}%`,
          x: "-50%",
          y: "-50%",
          scale: isDragging ? 1.25 : isHovered ? 1.12 : 1,
        }}
        transition={
          isDragging
            ? {
                left: { duration: 0 },
                scale: { type: "spring", stiffness: 450, damping: 28 },
              }
            : {
                left: { type: "spring", stiffness: 420, damping: 32 },
                scale: { type: "spring", duration: 0.18, bounce: 0 },
              }
        }
      />
    </div>
  )
}
