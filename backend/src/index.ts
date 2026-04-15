import 'dotenv/config'
import { EventEmitter } from 'eventemitter3'
import { initDb } from './db/schema'
import { getOpenPositions } from './db/queries'
import { startHolderPoller } from './services/holderPoller'
import { startTxListener } from './services/txListener'
import { startScoreManager } from './services/scoreManager'
import { startWsServer } from './ws/server'
import { startHttpServer } from './api/httpServer'
import { config } from './config'
import type { BusEvents, Position } from './types'

async function main() {
  if (process.env.DEMO_MODE === 'true') {
    const { startDemoServer } = await import('./demo')
    startDemoServer()
    return
  }

  console.log('🌬️  VANE starting...')

  await initDb()
  console.log('[DB] Schema ready')

  const positions = new Map<string, Position>()
  const existing = await getOpenPositions()
  for (const p of existing) positions.set(p.id, p)
  console.log(`[DB] Loaded ${positions.size} open positions`)

  const bus = new EventEmitter<BusEvents>()
  const getPositions = () => Array.from(positions.values())

  startScoreManager(bus, getPositions, (id) => positions.delete(id))
  startHolderPoller(bus, getPositions)

  if (config.apiPlan === 'pro') {
    startTxListener(bus, getPositions)
  } else {
    console.log('[TxListener] Skipped — requires pro API plan')
  }

  startWsServer(bus)
  startHttpServer(bus, positions)

  console.log('✅ VANE is running')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
