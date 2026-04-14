'use client'
import { useStore } from '@/store/useStore'
import type { Position } from '@/lib/types'

interface Props { positions: Position[] }

const MODE_ORDER = { RELAXED: 0, NORMAL: 1, ALERT: 2, WARNING: 3, CRITICAL: 4 }

export function PortfolioSummary({ positions }: Props) {
  const scores = useStore(s => s.scores)

  if (positions.length === 0) return null

  const totalExposure = positions.reduce((s, p) => s + p.sizeUsd, 0)
  const atRisk = positions.filter(p => {
    const mode = scores[p.id]?.mode
    return mode === 'ALERT' || mode === 'WARNING' || mode === 'CRITICAL'
  })
  const highestScore = positions.reduce((max, p) => {
    const s = scores[p.id]?.score ?? 0
    return s > max ? s : max
  }, 0)
  const worstMode = positions.reduce((worst, p) => {
    const mode = scores[p.id]?.mode ?? 'NORMAL'
    return (MODE_ORDER[mode as keyof typeof MODE_ORDER] ?? 0) > (MODE_ORDER[worst as keyof typeof MODE_ORDER] ?? 0) ? mode : worst
  }, 'NORMAL' as string)

  const modeColor: Record<string, string> = {
    RELAXED: 'text-emerald-400', NORMAL: 'text-slate-300',
    ALERT: 'text-yellow-400', WARNING: 'text-orange-400', CRITICAL: 'text-red-400',
  }

  return (
    <div className="glass rounded-2xl px-5 py-4 grid grid-cols-4 gap-4 divide-x divide-slate-700/50">
      <div>
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mb-1">Total Exposure</p>
        <p className="text-xl font-black text-slate-100 tabular-nums">${totalExposure.toFixed(2)}</p>
        <p className="text-xs text-slate-600 mt-0.5">{positions.length} position{positions.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="pl-4">
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mb-1">Positions at Risk</p>
        <p className={`text-xl font-black tabular-nums ${atRisk.length > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
          {atRisk.length}
        </p>
        <p className="text-xs text-slate-600 mt-0.5">ALERT or above</p>
      </div>
      <div className="pl-4">
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mb-1">Highest Score</p>
        <p className={`text-xl font-black tabular-nums ${modeColor[worstMode] ?? 'text-slate-300'}`}>
          {highestScore}
        </p>
        <p className={`text-xs mt-0.5 ${modeColor[worstMode] ?? 'text-slate-600'}`}>{worstMode}</p>
      </div>
      <div className="pl-4">
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mb-1">Portfolio Health</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                highestScore <= 20 ? 'bg-emerald-500' :
                highestScore <= 40 ? 'bg-slate-400' :
                highestScore <= 60 ? 'bg-yellow-500' :
                highestScore <= 80 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${100 - highestScore}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 tabular-nums">{100 - highestScore}%</span>
        </div>
        <p className="text-xs text-slate-600 mt-1">inverse of max danger</p>
      </div>
    </div>
  )
}
