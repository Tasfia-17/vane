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
  NORMAL:   'border-slate-700',
  ALERT:    'border-yellow-500/40',
  WARNING:  'border-orange-500/50',
  CRITICAL: 'border-red-500/70',
}

const EVENT_ICONS: Record<string, string> = {
  'Stop adjusted': '⚙',
  'Trade executed': '⚡',
  default: '●',
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

  const borderClass = score ? (MODE_BORDER[score.mode] ?? 'border-slate-700') : 'border-slate-700'
  const isCritical = score?.mode === 'CRITICAL'

  return (
    <div className={`rounded-2xl border-2 bg-[#020817] transition-all duration-500 overflow-hidden ${borderClass} ${isCritical ? 'critical-pulse' : ''}`}>

      {/* Top bar — token info */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {/* Chain badge */}
          <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400 uppercase tracking-wider">
            {position.chain}
          </span>
          <div>
            <div className="font-mono text-slate-200 text-sm font-semibold tracking-tight">
              {position.tokenAddress.slice(0, 8)}
              <span className="text-slate-600">…</span>
              {position.tokenAddress.slice(-6)}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Entry <span className="text-slate-400 font-mono">${position.entryPrice.toFixed(8)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-slate-200 font-bold text-lg tabular-nums">${position.sizeUsd.toFixed(2)}</div>
            <div className="text-xs text-slate-600">position size</div>
          </div>
          <button
            onClick={() => onClose(position.id)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-500 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Danger gauge */}
        <DangerGauge score={score} />

        {/* Holder table */}
        {holders && holders.length > 0 && (
          <HolderTable holders={holders} top10Pct={top10Pct} holderCount={holderCount} />
        )}

        {/* Event log */}
        {events.length > 0 && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700/50">
              <span className="text-xs font-mono text-slate-500 tracking-widest uppercase">Activity Log</span>
            </div>
            <div className="divide-y divide-slate-700/30">
              {events.slice(0, 6).map((e, i) => {
                const isStop = e.message.startsWith('Stop')
                const isTrade = e.message.startsWith('Trade')
                return (
                  <div key={i} className="slide-in flex items-start gap-3 px-5 py-3 hover:bg-slate-800/30 transition-colors">
                    <span className={`text-base leading-none mt-0.5 ${isTrade ? 'text-red-400' : isStop ? 'text-yellow-400' : 'text-slate-500'}`}>
                      {isTrade ? '⚡' : isStop ? '⚙' : '●'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 leading-snug">{e.message}</p>
                    </div>
                    <span className="text-xs text-slate-600 tabular-nums shrink-0 font-mono">
                      {new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
