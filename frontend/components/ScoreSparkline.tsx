'use client'

interface Props {
  history: number[]   // last N scores, oldest first
  width?: number
  height?: number
}

export function ScoreSparkline({ history, width = 80, height = 28 }: Props) {
  if (history.length < 2) {
    return <div style={{ width, height }} className="flex items-center justify-center">
      <span className="text-xs text-slate-700">—</span>
    </div>
  }

  const max = 100
  const min = 0
  const range = max - min || 1
  const pts = history.slice(-12)
  const step = width / (pts.length - 1)

  const points = pts.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  const last = pts[pts.length - 1]
  const color = last <= 20 ? '#10b981' : last <= 40 ? '#94a3b8' : last <= 60 ? '#f59e0b' : last <= 80 ? '#f97316' : '#ef4444'

  // Fill area under line
  const fillPoints = `0,${height} ${points} ${(pts.length - 1) * step},${height}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${last}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#sg-${last})`}/>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Last point dot */}
      <circle
        cx={(pts.length - 1) * step}
        cy={height - ((last - min) / range) * height}
        r="2.5"
        fill={color}
      />
    </svg>
  )
}
