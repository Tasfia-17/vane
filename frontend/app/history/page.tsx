'use client'
import { useEffect, useState } from 'react'

interface ClosedPosition {
  id: string
  tokenAddress: string
  chain: string
  entryPrice: number
  sizeUsd: number
  openedAt: string
  closedAt: string
}

const API = process.env.NEXT_PUBLIC_API_URL!

export default function History() {
  const [positions, setPositions] = useState<ClosedPosition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/positions?status=closed`)
      .then(r => r.json())
      .then(data => setPositions(Array.isArray(data) ? data : []))
      .catch(() => setPositions([]))
      .finally(() => setLoading(false))
  }, [])

  function duration(open: string, close: string) {
    const ms = new Date(close).getTime() - new Date(open).getTime()
    const m = Math.floor(ms / 60000)
    const h = Math.floor(m / 60)
    if (h > 0) return `${h}h ${m % 60}m`
    return `${m}m`
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-slate-100">Position History</h1>
        <p className="text-xs text-slate-500 mt-1">All closed positions</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700/50 text-slate-500">
              <th className="text-left px-5 py-3 font-normal">Token</th>
              <th className="text-left px-3 py-3 font-normal">Chain</th>
              <th className="text-right px-3 py-3 font-normal">Size</th>
              <th className="text-right px-3 py-3 font-normal">Entry</th>
              <th className="text-right px-3 py-3 font-normal">Duration</th>
              <th className="text-right px-5 py-3 font-normal">Closed</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-600">Loading…</td></tr>
            )}
            {!loading && positions.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-600">No closed positions yet</td></tr>
            )}
            {positions.map(p => (
              <tr key={p.id} className="border-b border-slate-700/20 hover:bg-slate-800/20 transition-colors">
                <td className="px-5 py-3 font-mono text-slate-300">
                  {p.tokenAddress.slice(0, 8)}<span className="text-slate-600">…</span>{p.tokenAddress.slice(-6)}
                </td>
                <td className="px-3 py-3">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 uppercase text-xs">{p.chain}</span>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-300">${p.sizeUsd.toFixed(2)}</td>
                <td className="px-3 py-3 text-right tabular-nums font-mono text-slate-400">${p.entryPrice.toFixed(8)}</td>
                <td className="px-3 py-3 text-right text-slate-500">{duration(p.openedAt, p.closedAt)}</td>
                <td className="px-5 py-3 text-right text-slate-600 font-mono">
                  {new Date(p.closedAt).toLocaleDateString()} {new Date(p.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
