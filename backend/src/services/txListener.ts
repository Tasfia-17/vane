import WebSocket from 'ws'
import { EventEmitter } from 'eventemitter3'
import { config } from '../config'
import type { Position, TxEvent, BusEvents } from '../types'

export function startTxListener(
  bus: EventEmitter<BusEvents>,
  getPositions: () => Position[]
): void {
  let ws: WebSocket
  let subscribed = new Set<string>()

  const connect = () => {
    ws = new WebSocket(config.dataWssUrl, { headers: { 'X-API-KEY': config.aveApiKey } })

    ws.on('open', () => {
      console.log('[TxListener] WebSocket connected')
      subscribed.clear()
      subscribeAll()
    })

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (!msg.result) return
        const event: TxEvent = msg.result
        if (event.type !== 'tx' && event.type !== 'multi_tx') return

        // Find which position this pair belongs to
        const positions = getPositions()
        for (const pos of positions) {
          if (pos.pairAddress === event.pair && pos.chain === event.chain) {
            bus.emit('tx:event', { ...event, positionId: pos.id })
          }
        }
      } catch { /* ignore malformed messages */ }
    })

    ws.on('close', () => {
      console.log('[TxListener] Disconnected — reconnecting in 2s')
      setTimeout(connect, 2000)
    })

    ws.on('error', (err) => console.error('[TxListener] Error:', err.message))
  }

  const subscribeAll = () => {
    const positions = getPositions()
    for (const pos of positions) {
      const key = `${pos.pairAddress}-${pos.chain}`
      if (subscribed.has(key)) continue
      subscribe(pos.pairAddress, pos.chain)
    }
  }

  const subscribe = (pairAddress: string, chain: string) => {
    if (ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      method: 'subscribe',
      params: ['tx', pairAddress, chain],
      id: Date.now(),
    }))
    subscribed.add(`${pairAddress}-${chain}`)
    console.log(`[TxListener] Subscribed to ${pairAddress} on ${chain}`)
  }

  // Allow external code to subscribe new positions
  bus.on('holder:snapshot', () => subscribeAll())

  connect()
}
