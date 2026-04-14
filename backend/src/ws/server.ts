import { WebSocketServer, WebSocket } from 'ws'
import { EventEmitter } from 'eventemitter3'
import { config } from '../config'
import type { BusEvents, WsMessage } from '../types'

export function startWsServer(bus: EventEmitter<BusEvents>): WebSocketServer {
  const wss = new WebSocketServer({ port: config.wsPort })

  const broadcast = (msg: WsMessage) => {
    const data = JSON.stringify(msg)
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(data)
    }
  }

  bus.on('score:updated', (score) =>
    broadcast({ type: 'score:update', payload: score })
  )

  bus.on('stop:adjusted', (payload) =>
    broadcast({ type: 'stop:adjusted', payload })
  )

  bus.on('trade:executed', (payload) =>
    broadcast({ type: 'trade:executed', payload })
  )

  bus.on('holder:snapshot', (snap) =>
    broadcast({
      type: 'holder:update',
      payload: {
        tokenAddress: snap.tokenAddress,
        top10Pct: snap.top10Pct,
        holderCount: snap.holderCount,
        topHolders: snap.holders.slice(0, 10),
      },
    })
  )

  wss.on('connection', (ws) => {
    console.log('[WsServer] Client connected')
    ws.on('close', () => console.log('[WsServer] Client disconnected'))
  })

  console.log(`[WsServer] Listening on ws://localhost:${config.wsPort}`)
  return wss
}
