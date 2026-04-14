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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">VANE</span>
          <span className="text-xs text-slate-500 font-mono">stops that read the wind</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-slate-600'}`} />
          <span className="text-xs text-slate-500">{wsConnected ? 'live' : 'connecting…'}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        {/* Open positions */}
        {positions.map(pos => (
          <PositionCard key={pos.id} position={pos} onClose={close} />
        ))}

        {/* Empty state */}
        {positions.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <div className="text-4xl mb-3">🌬️</div>
            <div className="text-sm">No open positions. Open one to start watching.</div>
          </div>
        )}

        {/* Open position form */}
        <OpenPositionForm onOpen={open} />
      </main>
    </div>
  )
}
