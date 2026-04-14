'use client'
import { useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import type { WsMessage } from '@/lib/types'

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const { updateScore, updateHolders, addEvent, setPositions, setWsConnected } = useStore()

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!)
      wsRef.current = ws

      ws.onopen = () => {
        setWsConnected(true)
        console.log('[WS] Connected')
      }

      ws.onmessage = (e) => {
        try {
          const msg: WsMessage = JSON.parse(e.data)
          switch (msg.type) {
            case 'score:update':
              updateScore(msg.payload)
              break
            case 'holder:update':
              updateHolders(
                msg.payload.tokenAddress,
                msg.payload.topHolders,
                msg.payload.holderCount,
                msg.payload.top10Pct
              )
              break
            case 'stop:adjusted':
              addEvent(msg.payload.positionId, `Stop adjusted to ${msg.payload.newStopPct.toFixed(1)}% — ${msg.payload.reason}`)
              break
            case 'trade:executed':
              addEvent(msg.payload.positionId, `Trade executed: ${msg.payload.tradeType} — tx: ${msg.payload.txHash.slice(0, 12)}…`)
              break
            case 'position:list':
              setPositions(msg.payload)
              break
          }
        } catch { /* ignore */ }
      }

      ws.onclose = () => {
        setWsConnected(false)
        console.log('[WS] Disconnected — reconnecting in 2s')
        setTimeout(connect, 2000)
      }

      ws.onerror = () => ws.close()
    }

    connect()
    return () => wsRef.current?.close()
  }, [])
}
