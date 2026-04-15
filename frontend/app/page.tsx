'use client'
import { useStore } from '@/store/useStore'
import { usePositions } from '@/hooks/usePositions'
import { PositionCard } from '@/components/PositionCard'
import { OpenPositionForm } from '@/components/OpenPositionForm'
import { PortfolioSummary } from '@/components/PortfolioSummary'
import { ActivityFeed } from '@/components/ActivityFeed'

export default function Dashboard() {
  const { positions, open, close } = usePositions()

  return (
    <main className="max-w-7xl mx-auto px-6 py-6">
      {positions.length > 0 && (
        <div className="mb-6">
          <PortfolioSummary positions={positions} />
        </div>
      )}

      <div className="flex gap-6 items-start">
        {/* Positions */}
        <div className="flex-1 min-w-0 space-y-4">
          {positions.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                  <path d="M16 4L16 28M6 14L16 4L26 14" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 22L16 16L28 22" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-slate-500 text-sm font-medium">No open positions</p>
              <p className="text-slate-700 text-xs mt-1">Open a position to start watching holder behavior</p>
            </div>
          )}
          {positions.map(pos => (
            <PositionCard key={pos.id} position={pos} onClose={close} />
          ))}
          <OpenPositionForm onOpen={open} />
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0 sticky top-20 space-y-4">
          <ActivityFeed positions={positions} />
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/50">
              <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">How VANE Works</span>
            </div>
            <div className="p-4 space-y-3">
              {[
                { icon: '👁', title: 'Watches holders', desc: 'Polls top-100 holders every 60s for balance changes' },
                { icon: '⚡', title: 'Real-time txs', desc: 'WebSocket stream catches dev wallet moves instantly' },
                { icon: '🧠', title: 'Scores danger', desc: 'Computes 0-100 score from whale behavior signals' },
                { icon: '⚙', title: 'Adjusts stops', desc: 'Cancels and recreates AVE proxy wallet orders' },
                { icon: '🚨', title: 'Hard exits', desc: '15% slippage tolerance — get out at any cost' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-2.5">
                  <span className="text-base leading-none mt-0.5">{icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">{title}</p>
                    <p className="text-xs text-slate-600 leading-snug mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
