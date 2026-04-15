'use client'
import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStore } from '@/store/useStore'
import { usePositions } from '@/hooks/usePositions'
import { DangerGauge } from '@/components/DangerGauge'
import { HolderTable } from '@/components/HolderTable'
import { ScoreSparkline } from '@/components/ScoreSparkline'

function timeAgo(date: string | Date) {
  const ms = Date.now() - new Date(date).getTime()
  const m = Math.floor(ms / 60000)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  if (m > 0) return `${m}m`
  return 'just now'
}

export default function PositionDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { close } = usePositions()

  const position = useStore(s => s.positions.find(p => p.id === id))
  const score = useStore(s => id ? s.scores[id] : undefined)
  const scoreHistory = useStore(s => id ? s.scoreHistory[id] : undefined)
  const holders = useStore(s => position ? s.holders[position.tokenAddress] : undefined)
  const holderCount = useStore(s => position ? s.holderCounts[position.tokenAddress] ?? 0 : 0)
  const top10Pct = useStore(s => position ? s.top10Pcts[position.tokenAddress] ?? 0 : 0)
  const currentPrice = useStore(s => position ? s.currentPrices[position.tokenAddress] : undefined)
  const allEvents = useStore(s => s.events)
  const events = useMemo(() => allEvents.filter(e => e.positionId === id), [allEvents, id])

  if (!position) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-slate-500">Position not found.</p>
        <button onClick={() => router.push('/')} className="mt-4 text-xs text-slate-400 hover:text-slate-200 underline">
          Back to dashboard
        </button>
      </main>
    )
  }

  const pnlPct = currentPrice && position.entryPrice
    ? ((currentPrice - position.entryPrice) / position.entryPrice) * 100
    : null
  const pnlUsd = pnlPct !== null ? (position.sizeUsd * pnlPct) / 100 : null

  return (
    <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/')} className="text-slate-600 hover:text-slate-300 transition-colors">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 3L5 8L10 13"/>
          </svg>
        </button>
        <span className="text-xs text-slate-600">Dashboard</span>
        <span className="text-slate-700">/</span>
        <span className="text-xs font-mono text-slate-400">{position.tokenAddress.slice(0, 10)}…</span>
      </div>

      {/* Position header card */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400 uppercase">{position.chain}</span>
            <div>
              <p className="font-mono text-slate-100 font-semibold">{position.tokenAddress}</p>
              <p className="text-xs text-slate-600 mt-0.5">Opened {timeAgo(position.openedAt)} ago · Order ID: <span className="font-mono">{position.orderId?.slice(0, 12) ?? 'none'}…</span></p>
            </div>
          </div>
          <button
            onClick={async () => { await close(position.id); router.push('/') }}
            className="px-3 py-1.5 rounded-lg border border-red-500/30 text-xs text-red-400 hover:bg-red-500/10 transition-all"
          >
            Close Position
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-5 gap-4 mt-5 pt-5 border-t border-slate-700/50">
          {[
            { label: 'Entry Price',   value: `$${position.entryPrice.toFixed(8)}`,  mono: true },
            { label: 'Current Price', value: currentPrice ? `$${currentPrice.toFixed(8)}` : '—', mono: true },
            { label: 'Size (USD)',    value: `$${position.sizeUsd.toFixed(2)}`,      mono: false },
            { label: 'Unrealized PnL', value: pnlPct !== null ? `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%` : '—',
              color: pnlPct === null ? 'text-slate-400' : pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400', mono: false },
            { label: 'PnL (USD)',     value: pnlUsd !== null ? `${pnlUsd >= 0 ? '+' : ''}$${pnlUsd.toFixed(2)}` : '—',
              color: pnlUsd === null ? 'text-slate-400' : pnlUsd >= 0 ? 'text-emerald-400' : 'text-red-400', mono: false },
          ].map(({ label, value, mono, color }) => (
            <div key={label}>
              <p className="text-xs text-slate-600 mb-1">{label}</p>
              <p className={`text-sm font-semibold ${color ?? 'text-slate-200'} ${mono ? 'font-mono' : ''}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: danger gauge */}
        <div className="col-span-2 space-y-4">
          <DangerGauge score={score} />
          {holders && holders.length > 0 && (
            <HolderTable holders={holders} top10Pct={top10Pct} holderCount={holderCount} />
          )}
        </div>

        {/* Right: score history + full event log */}
        <div className="space-y-4">
          {/* Score history */}
          <div className="glass rounded-2xl p-4">
            <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">Score History</p>
            {scoreHistory && scoreHistory.length >= 2 ? (
              <>
                <ScoreSparkline history={scoreHistory} width={200} height={60} />
                <div className="flex justify-between text-xs text-slate-600 mt-2">
                  <span>oldest</span>
                  <span>now: <span className="text-slate-300 font-semibold">{scoreHistory[scoreHistory.length - 1]}</span></span>
                </div>
                <p className="text-xs text-slate-700 mt-2">Live session only. Full backtest available via <span className="font-mono">/backtest/{'{token}'}/{'{chain}'}</span></p>
              </>
            ) : (
              <p className="text-xs text-slate-700">Waiting for snapshots…</p>
            )}
          </div>

          {/* Full event log */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/50">
              <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">Full Event Log</span>
            </div>
            {events.length === 0 ? (
              <p className="px-4 py-6 text-xs text-slate-700 text-center">No events yet</p>
            ) : (
              <div className="divide-y divide-slate-700/30 max-h-96 overflow-y-auto">
                {events.map((e, i) => {
                  const isStop = e.message.startsWith('Stop')
                  const isTrade = e.message.startsWith('Trade')
                  return (
                    <div key={i} className="px-4 py-2.5 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start gap-2">
                        <span className={`text-sm leading-none mt-0.5 ${isTrade ? 'text-red-400' : isStop ? 'text-yellow-400' : 'text-slate-600'}`}>
                          {isTrade ? '⚡' : isStop ? '⚙' : '●'}
                        </span>
                        <p className="flex-1 text-xs text-slate-300 leading-snug">{e.message}</p>
                      </div>
                      <p className="text-xs text-slate-700 font-mono mt-0.5 pl-5">
                        {new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
