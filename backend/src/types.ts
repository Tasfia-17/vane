// ─── AVE API Types ────────────────────────────────────────────────────────────

export interface AveResponse<T> {
  status: number
  msg: string
  data_type: number
  data: T
}

export interface Holder {
  address: string
  balance: string
  percentage: number
  is_contract: boolean
  tag?: string
}

export interface HoldersData {
  holders: Holder[]
  total_count: number
}

export interface RiskData {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  risk_score: number
  honeypot: boolean
  buy_tax: number
  sell_tax: number
  owner: string
  ownership_renounced: boolean
  top_holder_concentration: number
}

export interface TxEvent {
  type: 'tx' | 'multi_tx' | 'liq'
  pair: string
  chain: string
  time: number
  tx_hash: string
  side: 'buy' | 'sell'
  amount_usd: number
  price: number
  sender: string
}

export interface SwapOrderResponse {
  status: number
  msg: string
  data: { id: string }
}

// ─── Domain Types ─────────────────────────────────────────────────────────────

export type Chain = 'solana' | 'eth' | 'bsc' | 'base'

export interface Position {
  id: string
  tokenAddress: string
  pairAddress: string
  chain: Chain
  entryPrice: number
  size: number          // in token units
  sizeUsd: number
  status: 'open' | 'closed'
  orderId?: string      // AVE proxy wallet order ID
  openedAt: Date
  closedAt?: Date
}

export interface HolderSnapshot {
  tokenAddress: string
  chain: Chain
  holders: Holder[]
  top10Pct: number
  holderCount: number
  snapshotAt: Date
}

// ─── Signal Types ─────────────────────────────────────────────────────────────

export type SignalType =
  | 'WHALE_SELL'          // top-10 holder sold >5% of their position
  | 'MULTI_WHALE_SELL'    // 3+ top-50 holders selling in 30min window
  | 'DEV_WALLET_MOVE'     // known dev wallet → DEX
  | 'HOLDER_COUNT_DROP'   // total holders dropped >5% in 24h
  | 'WHALE_BUY'           // top-10 holder increasing balance
  | 'NEW_WHALE_ENTRY'     // new wallet entered top-50

export interface Signal {
  type: SignalType
  weight: number          // positive = danger, negative = safe
  detail: string
  detectedAt: Date
}

export interface DangerScore {
  positionId: string
  score: number           // 0-100
  mode: 'RELAXED' | 'NORMAL' | 'ALERT' | 'WARNING' | 'CRITICAL'
  signals: Signal[]
  computedAt: Date
}

// ─── Internal Event Bus Types ─────────────────────────────────────────────────

export interface BusEvents {
  'holder:snapshot': HolderSnapshot
  'tx:event': TxEvent & { positionId: string }
  'score:updated': DangerScore
  'stop:adjusted': { positionId: string; newStopPct: number; reason: string }
  'trade:executed': { positionId: string; txHash: string; type: string }
}

// ─── WebSocket Push Types (backend → frontend) ────────────────────────────────

export type WsMessage =
  | { type: 'score:update'; payload: DangerScore }
  | { type: 'holder:update'; payload: { tokenAddress: string; top10Pct: number; holderCount: number; topHolders: Holder[] } }
  | { type: 'stop:adjusted'; payload: { positionId: string; newStopPct: number; reason: string } }
  | { type: 'trade:executed'; payload: { positionId: string; txHash: string; tradeType: string } }
  | { type: 'position:list'; payload: Position[] }
