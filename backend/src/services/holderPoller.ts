import cron from 'node-cron'
import { EventEmitter } from 'eventemitter3'
import { getTopHolders } from '../api/dataClient'
import { insertHolderSnapshot } from '../db/queries'
import type { Position, HolderSnapshot, BusEvents } from '../types'

export function startHolderPoller(
  bus: EventEmitter<BusEvents>,
  getPositions: () => Position[]
): void {
  const poll = async () => {
    const positions = getPositions()
    if (positions.length === 0) return

    // Deduplicate by token+chain so we don't hit the API N times for same token
    const seen = new Set<string>()
    for (const pos of positions) {
      const key = `${pos.tokenAddress}-${pos.chain}`
      if (seen.has(key)) continue
      seen.add(key)

      try {
        const holders = await getTopHolders(pos.tokenAddress, pos.chain)
        const top10Pct = holders
          .slice(0, 10)
          .reduce((sum, h) => sum + h.percentage, 0)

        const snapshot: HolderSnapshot = {
          tokenAddress: pos.tokenAddress,
          chain: pos.chain,
          holders,
          top10Pct,
          holderCount: holders.length,
          snapshotAt: new Date(),
        }

        await insertHolderSnapshot(snapshot)
        bus.emit('holder:snapshot', snapshot)
      } catch (err) {
        console.error(`[Poller] Failed for ${key}:`, err)
      }
    }
  }

  // Run immediately, then every 60s
  poll()
  cron.schedule('*/1 * * * *', poll)
  console.log('[Poller] Started — polling every 60s')
}
