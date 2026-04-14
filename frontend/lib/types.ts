// Shared types between backend and frontend
export type Chain = 'solana' | 'eth' | 'bsc' | 'base'

export interface Position {
  id: string
  tokenAddress: string
  pairAddress: string
  chain: Chain
  entryPrice: number
  size: number
  sizeUsd: number
  status: 'open' | 'closed'
  orderId?: string
  openedAt: string
  closedAt?: string
}

export interface Holder {
  address: string
  balance: string
  percentage: number
  is_contract: boolean
  tag?: string
}

export type SignalType =
  | 'WHALE_SELL'
  | 'MULTI_WHALE_SELL'
  | 'DEV_WALLET_MOVE'
  | 'HOLDER_COUNT_DROP'
  | 'WHALE_BUY'
  | 'NEW_WHALE_ENTRY'

export interface Signal {
  type: SignalType
  weight: number
  detail: string
  detectedAt: string
}

export interface DangerScore {
  positionId: string
  score: number
  mode: 'RELAXED' | 'NORMAL' | 'ALERT' | 'WARNING' | 'CRITICAL'
  signals: Signal[]
  computedAt: string
}

export type WsMessage =
  | { type: 'score:update'; payload: DangerScore }
  | { type: 'holder:update'; payload: { tokenAddress: string; top10Pct: number; holderCount: number; topHolders: Holder[] } }
  | { type: 'stop:adjusted'; payload: { positionId: string; newStopPct: number; reason: string } }
  | { type: 'trade:executed'; payload: { positionId: string; txHash: string; tradeType: string } }
  | { type: 'position:list'; payload: Position[] }
