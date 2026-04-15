'use client'
import { useMemo } from 'react'
import { useStore } from '@/store/useStore'
import type { Position } from '@/lib/types'
import { DangerGauge } from './DangerGauge'
import { HolderTable } from './HolderTable'
import { ScoreSparkline } from './ScoreSparkline'

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

function timeAgo(date: string | Date) {
  const ms = Date.now() - new Date(date).getTime()
  const m = Math.floor(ms / 60000)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  if (m > 0) return `${m}m`
  return 'just now'
}

export function PositionCard({ position, onClose }: Props) {
  const score = useStore(s => s.scores[position.id])
  const scoreHistory = useStore(s => s.scoreHistory[position.id])
  const holders = useStore(s => s.holders[position.tokenAddress])
  const holderCount = useStore(s => s.holderCounts[position.tokenAddress] ?? 0)
  const top10Pct = useStore(s => s.top10Pcts[position.tokenAddress] ?? 0)
  const currentPrice = useStore(s => s.currentPrices[position.tokenAddress])
  const allEvents = useStore(s => s.events)
  const events = useMemo(
    () => allEvents.filter(e => e.positionId === position.id),
    [allEvents, position.id]
  )

  const borderClass = score ? (MODE_BORDER[score.mode] ?? 'border-slate-700') : 'border-slate-700'
  const isCritical = score?.mode === 'CRITICAL'

  // PnL calculation
  const pnlPct = currentPrice && position.entryPrice
    ? ((currentPrice - position.entryPrice) / position.entryPrice) * 100
    : null
  const pnlUsd = pnlPct !== null ? (position.sizeUsd * pnlPct) / 100 : null

  return (
    <div className={`rounded-2xl border-2 bg-[#020817] transition-all duration-500 overflow-hidden ${borderClass} ${isCritical ? 'critical-pulse' : ''}`}>

      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400 uppercase tracking-wider">
            {position.chain}
          </span>
          <div>
            <div className="font-mono text-slate-200 text-sm font-semibold">
              {position.tokenAddress.slice(0, 8)}<span className="text-slate-600">…</span>{position.tokenAddress.slice(-6)}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Opened <span className="text-slate-500">{timeAgo(position.openedAt)}</span> ago
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Score sparkline */}
          {scoreHistory && scoreHistory.length >= 2 && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-slate-600 font-mono">score trend</span>
              <ScoreSparkline history={scoreHistory} />
            </div>
          )}

          <div className="text-right">
            <div className="text-slate-200 font-bold text-lg tabular-nums">${position.sizeUsd.toFixed(2)}</div>
            {pnlPct !== null && (
              <div className={`text-xs font-semibold tabular-nums ${pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}% ({pnlPct >= 0 ? '+' : ''}${pnlUsd?.toFixed(2)})
              </div>
            )}
          </div>

          <button
            onClick={() => onClose(position.id)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-500 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            Close
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 divide-x divide-slate-800 border-b border-slate-800/80">
        {[
          { label: 'Entry Price', value: `$${position.entryPrice.toFixed(8)}`, mono: true },
          { label: 'Current Price', value: currentPrice ? `$${currentPrice.toFixed(8)}` : '—', mono: true },
          { label: 'Position Size', value: `${position.size.toLocaleString(undefined, { maximumFractionDigits: 0 })} tokens`, mono: false },
          { label: 'Top-10 Concentration', value: top10Pct > 0 ? `${top10Pct.toFixed(1)}%` : '—', mono: false,
            valueColor: top10Pct > 60 ? 'text-red-400' : top10Pct > 40 ? 'text-orange-400' : 'text-slate-300' },
        ].map(({ label, value, mono, valueColor }) => (
          <div key={label} className="px-4 py-3">
            <p className="text-xs text-slate-600 mb-1">{label}</p>
            <p className={`text-xs font-semibold ${valueColor ?? 'text-slate-300'} ${mono ? 'font-mono' : ''}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <DangerGauge score={score} />

        {holders && holders.length > 0 && (
          <HolderTable holders={holders} top10Pct={top10Pct} holderCount={holderCount} />
        )}

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
                    <p className="flex-1 text-xs text-slate-300 leading-snug">{e.message}</p>
                    <span className="text-xs text-slate-600 tabular-nums font-mono shrink-0">
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
