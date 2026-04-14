'use client'
import { useEffect } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { usePositions } from '@/hooks/usePositions'
import { useStore } from '@/store/useStore'
import { PositionCard } from '@/components/PositionCard'
import { OpenPositionForm } from '@/components/OpenPositionForm'

export default function Dashboard() {
  useWebSocket()
  const { positions, load, open, close } = usePositions()
  const wsConnected = useStore(s => s.wsConnected)

  useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen bg-[#020817]">
      {/* Subtle grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(51,65,85,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(51,65,85,0.08)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-[#020817]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              {/* Logo mark */}
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center">
                <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                  <path d="M10 2 L10 18 M4 8 L10 2 L16 8" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 14 L10 10 L18 14" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-base font-black tracking-tight text-slate-100">VANE</span>
            </div>
            <span className="text-xs text-slate-600 font-mono hidden sm:block">stops that read the wind</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Position count */}
            {positions.length > 0 && (
              <span className="text-xs text-slate-500 font-mono">
                {positions.length} position{positions.length !== 1 ? 's' : ''} open
              </span>
            )}
            {/* WS status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono transition-all ${
              wsConnected
                ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-400'
                : 'border-slate-700 bg-slate-800/50 text-slate-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
              {wsConnected ? 'live' : 'connecting'}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8 space-y-4">

        {/* Empty state */}
        {positions.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
                <path d="M16 4 L16 28 M6 14 L16 4 L26 14" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 22 L16 16 L28 22" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-medium">No open positions</p>
            <p className="text-slate-700 text-xs mt-1">Open a position to start watching holder behavior</p>
          </div>
        )}

        {/* Position cards */}
        {positions.map(pos => (
          <PositionCard key={pos.id} position={pos} onClose={close} />
        ))}

        {/* Open form */}
        <OpenPositionForm onOpen={open} />
      </main>
    </div>
  )
}
