import type { HolderSnapshot, Signal, DangerScore, TxEvent } from '../types'
import { config } from '../config'

const WEIGHTS = {
  WHALE_SELL: 20,
  MULTI_WHALE_SELL: 30,
  DEV_WALLET_MOVE: 35,
  HOLDER_COUNT_DROP: 15,
  WHALE_BUY: -15,
  NEW_WHALE_ENTRY: -10,
} as const

function scoreToMode(score: number): DangerScore['mode'] {
  if (score === 0)   return 'RELAXED'   // no signals at all
  if (score <= 25)   return 'NORMAL'    // minor signals, no action needed
  if (score <= 50)   return 'ALERT'     // one whale selling
  if (score <= 75)   return 'WARNING'   // multiple signals
  return 'CRITICAL'                     // dev wallet move or multi-whale confluence
}

export function stopMultiplier(mode: DangerScore['mode']): number {
  switch (mode) {
    case 'RELAXED':  return 1.20
    case 'NORMAL':   return 1.00
    case 'ALERT':    return 0.70
    case 'WARNING':  return 0.50
    case 'CRITICAL': return 0.30
  }
}

export function computeStopBps(mode: DangerScore['mode'], baseStopBps = 2000): number {
  return Math.round(baseStopBps * stopMultiplier(mode))
}

interface EngineState {
  prevSnapshot?: HolderSnapshot
  // Sliding window of whale sells for multi-whale confluence
  recentSells: Array<{ address: string; time: number }>
}

const state = new Map<string, EngineState>()

function getState(positionId: string): EngineState {
  if (!state.has(positionId)) state.set(positionId, { recentSells: [] })
  return state.get(positionId)!
}

export function clearState(positionId: string): void {
  state.delete(positionId)
}

export function scoreFromSnapshot(
  positionId: string,
  current: HolderSnapshot,
  devWallets: Set<string> = new Set()
): DangerScore {
  const s = getState(positionId)
  const signals: Signal[] = []
  // Score starts at 0 — signals add danger or subtract it.
  // No signals = RELAXED (0-20). Score only rises when bad things are detected.
  let score = 0
  const now = new Date()

  if (s.prevSnapshot) {
    const prev = s.prevSnapshot
    const prevMap = new Map(prev.holders.map(h => [h.address, h]))

    for (const holder of current.holders.slice(0, 10)) {
      const prevHolder = prevMap.get(holder.address)
      if (!prevHolder) continue
      const prevBal = parseFloat(prevHolder.balance)
      const curBal = parseFloat(holder.balance)
      if (prevBal === 0) continue
      const changePct = ((curBal - prevBal) / prevBal) * 100

      if (changePct < -config.whaleSellThresholdPct) {
        signals.push({
          type: 'WHALE_SELL',
          weight: WEIGHTS.WHALE_SELL,
          detail: `Holder ${holder.address.slice(0, 8)}… sold ${Math.abs(changePct).toFixed(1)}% of position`,
          detectedAt: now,
        })
        score += WEIGHTS.WHALE_SELL
        s.recentSells.push({ address: holder.address, time: Date.now() })
      } else if (changePct > config.whaleBuyThresholdPct) {
        signals.push({
          type: 'WHALE_BUY',
          weight: WEIGHTS.WHALE_BUY,
          detail: `Holder ${holder.address.slice(0, 8)}… added ${changePct.toFixed(1)}%`,
          detectedAt: now,
        })
        score += WEIGHTS.WHALE_BUY
      }
    }

    // New whale entry in top-50
    const prevTop50 = new Set(prev.holders.slice(0, 50).map(h => h.address))
    for (const holder of current.holders.slice(0, 50)) {
      if (!prevTop50.has(holder.address)) {
        signals.push({
          type: 'NEW_WHALE_ENTRY',
          weight: WEIGHTS.NEW_WHALE_ENTRY,
          detail: `New wallet entered top-50: ${holder.address.slice(0, 8)}… (${holder.percentage.toFixed(2)}%)`,
          detectedAt: now,
        })
        score += WEIGHTS.NEW_WHALE_ENTRY
        break
      }
    }

    // Holder count drop
    if (prev.holderCount > 0) {
      const dropPct = ((prev.holderCount - current.holderCount) / prev.holderCount) * 100
      if (dropPct > config.holderCountDropPct) {
        signals.push({
          type: 'HOLDER_COUNT_DROP',
          weight: WEIGHTS.HOLDER_COUNT_DROP,
          detail: `Holder count dropped ${dropPct.toFixed(1)}% (${prev.holderCount} → ${current.holderCount})`,
          detectedAt: now,
        })
        score += WEIGHTS.HOLDER_COUNT_DROP
      }
    }
  }

  // Multi-whale confluence (sliding 30-min window)
  const windowStart = Date.now() - config.multiWhaleWindowMs
  s.recentSells = s.recentSells.filter(e => e.time > windowStart)
  const uniqueSellers = new Set(s.recentSells.map(e => e.address))
  if (uniqueSellers.size >= config.multiWhaleCount) {
    signals.push({
      type: 'MULTI_WHALE_SELL',
      weight: WEIGHTS.MULTI_WHALE_SELL,
      detail: `${uniqueSellers.size} whales sold within 30-minute window`,
      detectedAt: now,
    })
    score += WEIGHTS.MULTI_WHALE_SELL
  }

  s.prevSnapshot = current
  score = Math.max(0, Math.min(100, score))

  return { positionId, score, mode: scoreToMode(score), signals, computedAt: now }
}

export function scoreFromTx(
  positionId: string,
  tx: TxEvent,
  topHolderAddresses: Set<string>,
  devWallets: Set<string>
): Signal | null {
  if (devWallets.has(tx.sender) && tx.side === 'sell') {
    return {
      type: 'DEV_WALLET_MOVE',
      weight: WEIGHTS.DEV_WALLET_MOVE,
      detail: `Dev wallet ${tx.sender.slice(0, 8)}… sold $${tx.amount_usd.toFixed(0)}`,
      detectedAt: new Date(),
    }
  }
  return null
}
