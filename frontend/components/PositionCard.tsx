'use client'
import { useMemo } from 'react'
import { useStore } from '@/store/useStore'
import type { Position } from '@/lib/types'
import { DangerGauge } from './DangerGauge'
import { HolderTable } from './HolderTable'

interface Props {
  position: Position
  onClose: (id: string) => void
}

const MODE_BORDER: Record<string, string> = {
  RELAXED:  'border-emerald-500/30',
  NORMAL:   'border-slate-600',
  ALERT:    'border-yellow-500/50',
  WARNING:  'border-orange-500/50',
  CRITICAL: 'border-red-500/70',
}

export function PositionCard({ position, onClose }: Props) {
  const score = useStore(s => s.scores[position.id])
  const holders = useStore(s => s.holders[position.tokenAddress])
  const holderCount = useStore(s => s.holderCounts[position.tokenAddress] ?? 0)
  const top10Pct = useStore(s => s.top10Pcts[position.tokenAddress] ?? 0)
  const allEvents = useStore(s => s.events)
  const events = useMemo(
    () => allEvents.filter(e => e.positionId === position.id),
    [allEvents, position.id]
  )

  const borderClass = score ? (MODE_BORDER[score.mode] ?? 'border-slate-600') : 'border-slate-600'

  return (
    <div className={`rounded-2xl border-2 bg-slate-900 p-5 space-y-4 transition-colors duration-500 ${borderClass}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-slate-200 text-sm">
            {position.tokenAddress.slice(0, 8)}…{position.tokenAddress.slice(-6)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {position.chain.toUpperCase()} · Entry ${position.entryPrice.toFixed(6)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-slate-200 font-semibold">${position.sizeUsd.toFixed(2)}</div>
          <button
            onClick={() => onClose(position.id)}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors mt-1"
          >
            Close position
          </button>
        </div>
      </div>

      {/* Danger gauge */}
      <DangerGauge score={score} />

      {/* Holder table */}
      {holders && holders.length > 0 && (
        <HolderTable holders={holders} top10Pct={top10Pct} holderCount={holderCount} />
      )}

      {/* Event log */}
      {events.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-3 space-y-1">
          <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Events</div>
          {events.slice(0, 5).map((e, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="text-slate-600 tabular-nums shrink-0">
                {new Date(e.time).toLocaleTimeString()}
              </span>
              <span className="text-slate-300">{e.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
