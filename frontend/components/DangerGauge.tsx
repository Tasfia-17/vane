'use client'
import type { DangerScore } from '@/lib/types'

const MODE_CONFIG: Record<DangerScore['mode'], {
  color: string; bg: string; bar: string; glow: string; label: string; stopHint: string
}> = {
  RELAXED:  { color: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/25', bar: 'bg-emerald-500', glow: 'glow-green', label: 'RELAXED', stopHint: 'Stop widened +20%' },
  NORMAL:   { color: 'text-slate-300',   bg: 'bg-slate-500/8 border-slate-500/25',     bar: 'bg-slate-400',   glow: '',           label: 'NORMAL',  stopHint: 'Stop unchanged' },
  ALERT:    { color: 'text-yellow-400',  bg: 'bg-yellow-500/8 border-yellow-500/30',   bar: 'bg-yellow-500',  glow: 'glow-yellow', label: 'ALERT',   stopHint: 'Stop tightened 30%' },
  WARNING:  { color: 'text-orange-400',  bg: 'bg-orange-500/8 border-orange-500/30',   bar: 'bg-orange-500',  glow: 'glow-orange', label: 'WARNING', stopHint: 'Stop tightened 50%' },
  CRITICAL: { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/60',        bar: 'bg-red-500',     glow: 'glow-red',    label: 'CRITICAL', stopHint: 'HARD EXIT triggered' },
}

const SIGNAL_ICONS: Record<string, string> = {
  WHALE_SELL:        '🐋',
  MULTI_WHALE_SELL:  '🌊',
  DEV_WALLET_MOVE:   '🚨',
  HOLDER_COUNT_DROP: '📉',
  WHALE_BUY:         '🟢',
  NEW_WHALE_ENTRY:   '🔵',
}

interface Props { score: DangerScore | undefined }

export function DangerGauge({ score }: Props) {
  if (!score) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
          <span className="text-xs font-mono text-slate-500 tracking-widest uppercase">Danger Score</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full mb-4" />
        <p className="text-slate-600 text-sm">Waiting for first holder snapshot...</p>
      </div>
    )
  }

  const cfg = MODE_CONFIG[score.mode]
  const pct = score.score
  const isCritical = score.mode === 'CRITICAL'

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-500 ${cfg.bg} ${cfg.glow} ${isCritical ? 'critical-pulse' : ''}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${cfg.bar} ${isCritical ? 'animate-ping' : ''}`} />
          <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">Danger Score</span>
        </div>
        <div className={`text-xs font-bold tracking-widest px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg}`}>
          {cfg.label}
        </div>
      </div>

      {/* Score number + bar */}
      <div className="flex items-end gap-4 mb-3">
        <span className={`text-5xl font-black tabular-nums leading-none score-flash ${cfg.color}`}>
          {pct}
        </span>
        <div className="flex-1 pb-2">
          <div className="flex justify-between text-xs text-slate-600 mb-1.5">
            <span>0</span>
            <span className="text-slate-500">{cfg.stopHint}</span>
            <span>100</span>
          </div>
          <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
            {/* Track segments */}
            <div className="absolute inset-0 flex">
              <div className="flex-1 border-r border-slate-700/50" />
              <div className="flex-1 border-r border-slate-700/50" />
              <div className="flex-1 border-r border-slate-700/50" />
              <div className="flex-1 border-r border-slate-700/50" />
              <div className="flex-1" />
            </div>
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${cfg.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Signals */}
      {score.signals.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-slate-700/40 pt-4">
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mb-2">Active Signals</p>
          {score.signals.map((sig, i) => (
            <div key={i} className="slide-in flex items-start gap-2.5 bg-slate-800/50 rounded-xl px-3 py-2.5">
              <span className="text-base leading-none mt-0.5">{SIGNAL_ICONS[sig.type] ?? '●'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-semibold ${sig.weight > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {sig.weight > 0 ? `+${sig.weight}` : sig.weight}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{sig.type.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">{sig.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
