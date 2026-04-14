'use client'
import { useStore } from '@/store/useStore'
import type { Position } from '@/lib/types'

interface Props { positions: Position[] }

const EVENT_STYLE: Record<string, { icon: string; color: string }> = {
  Stop:  { icon: '⚙', color: 'text-yellow-400' },
  Trade: { icon: '⚡', color: 'text-red-400' },
  default: { icon: '●', color: 'text-slate-500' },
}

function tokenShort(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-3)}`
}

export function ActivityFeed({ positions }: Props) {
  const events = useStore(s => s.events)

  const posMap = Object.fromEntries(positions.map(p => [p.id, p]))

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">Activity</span>
        <span className="text-xs text-slate-600">{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <div className="px-4 py-8 text-center text-slate-700 text-xs">No activity yet</div>
      ) : (
        <div className="divide-y divide-slate-700/20 max-h-80 overflow-y-auto">
          {events.slice(0, 20).map((e, i) => {
            const key = e.message.startsWith('Stop') ? 'Stop' : e.message.startsWith('Trade') ? 'Trade' : 'default'
            const style = EVENT_STYLE[key]
            const pos = posMap[e.positionId]
            return (
              <div key={i} className="slide-in px-4 py-2.5 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start gap-2">
                  <span className={`text-sm leading-none mt-0.5 ${style.color}`}>{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    {pos && (
                      <span className="text-xs font-mono text-slate-600 mr-1.5">
                        {tokenShort(pos.tokenAddress)}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 leading-snug">{e.message}</span>
                  </div>
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
  )
}
