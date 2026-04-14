'use client'
import type { Holder } from '@/lib/types'

interface Props {
  holders: Holder[]
  top10Pct: number
  holderCount: number
}

const RANK_COLORS = ['text-yellow-400', 'text-slate-300', 'text-orange-400']

export function HolderTable({ holders, top10Pct, holderCount }: Props) {
  const concentrationRisk = top10Pct > 60 ? 'text-red-400' : top10Pct > 40 ? 'text-orange-400' : 'text-emerald-400'

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">Top Holders</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Holders</span>
            <span className="text-slate-200 font-semibold tabular-nums">{holderCount.toLocaleString()}</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Top-10 concentration</span>
            <span className={`font-bold tabular-nums ${concentrationRisk}`}>{top10Pct.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Concentration bar */}
      <div className="h-0.5 bg-slate-800">
        <div
          className={`h-full transition-all duration-700 ${top10Pct > 60 ? 'bg-red-500' : top10Pct > 40 ? 'bg-orange-500' : 'bg-emerald-500'}`}
          style={{ width: `${Math.min(top10Pct, 100)}%` }}
        />
      </div>

      {/* Table */}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-700/30">
            <th className="text-left px-5 py-2.5 font-normal text-slate-600 w-8">#</th>
            <th className="text-left px-2 py-2.5 font-normal text-slate-600">Address</th>
            <th className="text-right px-2 py-2.5 font-normal text-slate-600">Share</th>
            <th className="text-right px-5 py-2.5 font-normal text-slate-600">Balance</th>
          </tr>
        </thead>
        <tbody>
          {holders.slice(0, 10).map((h, i) => (
            <tr key={h.address} className="border-b border-slate-700/20 hover:bg-slate-700/15 transition-colors group">
              <td className="px-5 py-2.5">
                <span className={`font-bold ${RANK_COLORS[i] ?? 'text-slate-600'}`}>{i + 1}</span>
              </td>
              <td className="px-2 py-2.5">
                <div className="flex items-center gap-2">
                  {h.tag ? (
                    <span className="px-2 py-0.5 rounded-md bg-yellow-500/15 text-yellow-400 font-semibold text-xs border border-yellow-500/20">
                      {h.tag}
                    </span>
                  ) : (
                    <span className="font-mono text-slate-400 group-hover:text-slate-300 transition-colors">
                      {h.address.slice(0, 6)}
                      <span className="text-slate-600">…</span>
                      {h.address.slice(-4)}
                    </span>
                  )}
                  {h.is_contract && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-500 text-xs">contract</span>
                  )}
                </div>
              </td>
              <td className="px-2 py-2.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${h.percentage > 10 ? 'bg-red-500' : h.percentage > 5 ? 'bg-orange-500' : 'bg-slate-500'}`}
                      style={{ width: `${Math.min((h.percentage / 20) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`tabular-nums font-semibold w-12 text-right ${h.percentage > 10 ? 'text-red-400' : h.percentage > 5 ? 'text-orange-400' : 'text-slate-300'}`}>
                    {h.percentage.toFixed(2)}%
                  </span>
                </div>
              </td>
              <td className="px-5 py-2.5 text-right tabular-nums text-slate-500 font-mono">
                {parseFloat(h.balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
