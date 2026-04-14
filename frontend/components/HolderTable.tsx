'use client'
import type { Holder } from '@/lib/types'

interface Props {
  holders: Holder[]
  top10Pct: number
  holderCount: number
}

export function HolderTable({ holders, top10Pct, holderCount }: Props) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Top Holders</span>
        <div className="flex gap-4 text-xs text-slate-400">
          <span>Total: <span className="text-slate-200">{holderCount.toLocaleString()}</span></span>
          <span>Top-10: <span className={top10Pct > 50 ? 'text-red-400' : 'text-slate-200'}>{top10Pct.toFixed(1)}%</span></span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700/50">
              <th className="text-left px-4 py-2 font-normal">#</th>
              <th className="text-left px-4 py-2 font-normal">Address</th>
              <th className="text-right px-4 py-2 font-normal">%</th>
              <th className="text-right px-4 py-2 font-normal">Balance</th>
            </tr>
          </thead>
          <tbody>
            {holders.slice(0, 10).map((h, i) => (
              <tr key={h.address} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                <td className="px-4 py-2 font-mono text-slate-300">
                  {h.tag
                    ? <span className="text-yellow-400">{h.tag}</span>
                    : `${h.address.slice(0, 6)}…${h.address.slice(-4)}`
                  }
                  {h.is_contract && <span className="ml-1 text-slate-500">[contract]</span>}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  <span className={h.percentage > 10 ? 'text-orange-400' : 'text-slate-300'}>
                    {h.percentage.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-400">
                  {parseFloat(h.balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
