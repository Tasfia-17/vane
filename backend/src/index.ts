import 'dotenv/config'
import { EventEmitter } from 'eventemitter3'
import { initDb } from './db/schema'
import { getOpenPositions } from './db/queries'
import { startHolderPoller } from './services/holderPoller'
import { startTxListener } from './services/txListener'
import { startScoreManager } from './services/scoreManager'
import { startWsServer } from './ws/server'
import { startHttpServer } from './api/httpServer'
import type { BusEvents, Position } from './types'

async function main() {
  console.log('🌬️  VANE starting...')

  // Init DB
  await initDb()
  console.log('[DB] Schema ready')

  // Load existing open positions into memory
  const positions = new Map<string, Position>()
  const existing = await getOpenPositions()
  for (const p of existing) positions.set(p.id, p)
  console.log(`[DB] Loaded ${positions.size} open positions`)

  // Internal event bus
  const bus = new EventEmitter<BusEvents>()

  // Accessor for current positions (services call this to get live state)
  const getPositions = () => Array.from(positions.values())

  // Start all services
  startScoreManager(bus, getPositions, (id) => positions.delete(id))
  startHolderPoller(bus, getPositions)

  // Only start WebSocket tx listener on pro plan
  if (process.env.API_PLAN === 'pro') {
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
