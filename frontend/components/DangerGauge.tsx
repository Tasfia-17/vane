'use client'
import type { DangerScore } from '@/lib/types'

const MODE_COLORS: Record<DangerScore['mode'], string> = {
  RELAXED:  'text-emerald-400',
  NORMAL:   'text-slate-300',
  ALERT:    'text-yellow-400',
  WARNING:  'text-orange-400',
  CRITICAL: 'text-red-500',
}

const MODE_BG: Record<DangerScore['mode'], string> = {
  RELAXED:  'bg-emerald-500/20 border-emerald-500/40',
  NORMAL:   'bg-slate-500/20 border-slate-500/40',
  ALERT:    'bg-yellow-500/20 border-yellow-500/40',
  WARNING:  'bg-orange-500/20 border-orange-500/40',
  CRITICAL: 'bg-red-500/20 border-red-500/40 animate-pulse',
}

const STOP_HINT: Record<DangerScore['mode'], string> = {
  RELAXED:  'Stop widened +20%',
  NORMAL:   'Stop unchanged',
  ALERT:    'Stop tightened 30%',
  WARNING:  'Stop tightened 50%',
  CRITICAL: 'HARD EXIT triggered',
}

interface Props {
  score: DangerScore | undefined
}

export function DangerGauge({ score }: Props) {
  if (!score) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <div className="text-slate-500 text-sm">Waiting for first snapshot…</div>
      </div>
    )
  }

  const pct = score.score
  const color = MODE_COLORS[score.mode]
  const bg = MODE_BG[score.mode]

  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Danger Score</span>
        <span className={`text-xs font-semibold ${color}`}>{score.mode}</span>
      </div>

      {/* Score bar */}
      <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            pct <= 20 ? 'bg-emerald-500' :
            pct <= 40 ? 'bg-slate-400' :
            pct <= 60 ? 'bg-yellow-500' :
            pct <= 80 ? 'bg-orange-500' : 'bg-red-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-end justify-between mb-3">
        <span className={`text-3xl font-bold tabular-nums ${color}`}>{pct}</span>
        <span className="text-xs text-slate-500">{STOP_HINT[score.mode]}</span>
      </div>

      {/* Signal breakdown */}
      {score.signals.length > 0 && (
        <div className="space-y-1 mt-3 border-t border-slate-700/50 pt-3">
          {score.signals.map((sig, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={sig.weight > 0 ? 'text-red-400' : 'text-emerald-400'}>
                {sig.weight > 0 ? '▲' : '▼'}
              </span>
              <span className="text-slate-300 leading-tight">{sig.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
