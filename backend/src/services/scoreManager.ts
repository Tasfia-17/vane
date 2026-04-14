import { EventEmitter } from 'eventemitter3'
import { scoreFromSnapshot, scoreFromTx, computeStopBps, clearState } from '../engine/signalEngine'
import { insertSignalEvent, insertTradeExecution, updateOrderId, closePosition } from '../db/queries'
import { cancelOrder, createSwapOrder } from '../api/tradeClient'
import type { Position, HolderSnapshot, DangerScore, BusEvents } from '../types'

const devWallets = new Map<string, Set<string>>()       // tokenAddress → Set<address>
const topHolderAddresses = new Map<string, Set<string>>() // tokenAddress → Set<address>
const lastMode = new Map<string, DangerScore['mode']>()

// Native output token per chain
const NATIVE: Record<string, string> = {
  solana: 'sol',
  eth: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  bsc: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  base: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
}

// Convert USD amount to chain-native smallest unit string
function toChainAmount(sizeUsd: number, entryPrice: number, chain: string): string {
  const tokenAmount = sizeUsd / entryPrice
  // Solana: lamports (1e9), EVM: wei approximation via token decimals (use 1e18 as default)
  const multiplier = chain === 'solana' ? 1e9 : 1e18
  return String(Math.round(tokenAmount * multiplier))
}

export function startScoreManager(
  bus: EventEmitter<BusEvents>,
  getPositions: () => Position[],
  removePosition: (id: string) => void
): void {

  bus.on('holder:snapshot', async (snap: HolderSnapshot) => {
    const positions = getPositions().filter(
      p => p.tokenAddress === snap.tokenAddress && p.chain === snap.chain
    )
    topHolderAddresses.set(snap.tokenAddress, new Set(snap.holders.slice(0, 50).map(h => h.address)))

    for (const pos of positions) {
      const score = scoreFromSnapshot(pos.id, snap, devWallets.get(pos.tokenAddress))
      await handleScore(bus, pos, score, removePosition)
    }
  })

  bus.on('tx:event', async (tx) => {
    const positions = getPositions().filter(p => p.id === tx.positionId)
    for (const pos of positions) {
      const devs = devWallets.get(pos.tokenAddress) ?? new Set()
      const topHolders = topHolderAddresses.get(pos.tokenAddress) ?? new Set()
      const signal = scoreFromTx(pos.id, tx, topHolders, devs)
      if (!signal) continue

      const score: DangerScore = {
        positionId: pos.id,
        score: 100,
        mode: 'CRITICAL',
        signals: [signal],
        computedAt: new Date(),
      }
      await handleScore(bus, pos, score, removePosition)
    }
  })
}

async function handleScore(
  bus: EventEmitter<BusEvents>,
  pos: Position,
  score: DangerScore,
  removePosition: (id: string) => void
): Promise<void> {
  bus.emit('score:updated', score)

  if (lastMode.get(pos.id) === score.mode) return
  lastMode.set(pos.id, score.mode)

  const signalId = await insertSignalEvent(score)

  if (score.mode === 'CRITICAL') {
    await hardExit(bus, pos, score, signalId, removePosition)
  } else {
    // RELAXED/NORMAL/ALERT/WARNING all adjust the stop (widen or tighten)
    await adjustStop(bus, pos, score, signalId)
  }
}

async function adjustStop(
  bus: EventEmitter<BusEvents>,
  pos: Position,
  score: DangerScore,
  signalId: number
): Promise<void> {
  if (!pos.orderId) return

  const newStopBps = computeStopBps(score.mode)
  const reason = score.signals.map(s => s.detail).join('; ') || `Mode changed to ${score.mode}`
  const native = NATIVE[pos.chain] ?? 'sol'

  try {
    await cancelOrder(pos.chain, pos.orderId)

    // Sell order: we hold the token (inToken), want native out
    const newOrderId = await createSwapOrder({
      chain: pos.chain,
      inTokenAddress: pos.tokenAddress,
      outTokenAddress: native,
      inAmount: toChainAmount(pos.sizeUsd, pos.entryPrice, pos.chain),
      swapType: 'sell',
      autoSellConfig: [
        { priceChange: `-${newStopBps}`, sellRatio: '10000', type: 'default' },
        { priceChange: '5000', sellRatio: '5000', type: 'default' },
        { priceChange: '10000', sellRatio: '5000', type: 'default' },
        { priceChange: `${Math.round(newStopBps * 0.5)}`, sellRatio: '10000', type: 'trailing' },
      ],
    })

    await updateOrderId(pos.id, newOrderId)
    // Update in-memory position orderId
    pos.orderId = newOrderId
    bus.emit('stop:adjusted', { positionId: pos.id, newStopPct: newStopBps / 100, reason })
    console.log(`[ScoreManager] Stop adjusted for ${pos.id}: ${newStopBps}bps (${score.mode})`)
  } catch (err) {
    console.error(`[ScoreManager] Failed to adjust stop for ${pos.id}:`, err)
  }
}

async function hardExit(
  bus: EventEmitter<BusEvents>,
  pos: Position,
  score: DangerScore,
  signalId: number,
  removePosition: (id: string) => void
): Promise<void> {
  console.log(`[ScoreManager] HARD EXIT triggered for ${pos.id}`)

  try {
    if (pos.orderId) await cancelOrder(pos.chain, pos.orderId).catch(() => {})

    const native = NATIVE[pos.chain] ?? 'sol'
    const orderId = await createSwapOrder({
      chain: pos.chain,
      inTokenAddress: pos.tokenAddress,
      outTokenAddress: native,
      inAmount: toChainAmount(pos.sizeUsd, pos.entryPrice, pos.chain),
      swapType: 'sell',
      slippage: '1500',  // 15% — get out at any cost
    })

    await insertTradeExecution({ positionId: pos.id, signalId, direction: 'sell', status: 'pending' })
    await closePosition(pos.id)

    // Remove from in-memory map so poller stops watching it
    removePosition(pos.id)
    lastMode.delete(pos.id)
    clearState(pos.id)

    bus.emit('trade:executed', { positionId: pos.id, txHash: orderId, type: 'hard_exit' })
  } catch (err) {
    console.error(`[ScoreManager] Hard exit failed for ${pos.id}:`, err)
  }
}

export function registerDevWallet(tokenAddress: string, address: string): void {
  if (!devWallets.has(tokenAddress)) devWallets.set(tokenAddress, new Set())
  devWallets.get(tokenAddress)!.add(address)
}
