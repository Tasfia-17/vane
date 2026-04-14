import { pool } from './schema'
import type { Position, HolderSnapshot, DangerScore, Chain } from '../types'

export async function insertPosition(p: Omit<Position, 'id' | 'openedAt'>): Promise<Position> {
  const { rows } = await pool.query(
    `INSERT INTO positions (token_address, pair_address, chain, entry_price, size, size_usd, order_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [p.tokenAddress, p.pairAddress, p.chain, p.entryPrice, p.size, p.sizeUsd, p.orderId ?? null]
  )
  return rowToPosition(rows[0])
}

export async function getOpenPositions(): Promise<Position[]> {
  const { rows } = await pool.query(`SELECT * FROM positions WHERE status = 'open' ORDER BY opened_at DESC`)
  return rows.map(rowToPosition)
}

export async function closePosition(id: string): Promise<void> {
  await pool.query(`UPDATE positions SET status='closed', closed_at=now() WHERE id=$1`, [id])
}

export async function updateOrderId(id: string, orderId: string): Promise<void> {
  await pool.query(`UPDATE positions SET order_id=$1 WHERE id=$2`, [orderId, id])
}

export async function insertHolderSnapshot(snap: HolderSnapshot): Promise<void> {
  await pool.query(
    `INSERT INTO holder_snapshots (token_address, chain, holder_count, top10_pct, holders_json)
     VALUES ($1,$2,$3,$4,$5)`,
    [snap.tokenAddress, snap.chain, snap.holderCount, snap.top10Pct, JSON.stringify(snap.holders)]
  )
}

export async function insertSignalEvent(score: DangerScore): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO signal_events (position_id, score, mode, signals)
     VALUES ($1,$2,$3,$4) RETURNING id`,
    [score.positionId, score.score, score.mode, JSON.stringify(score.signals)]
  )
  return rows[0].id
}

export async function insertTradeExecution(params: {
  positionId: string
  signalId?: number
  direction: 'buy' | 'sell'
  txHash?: string
  status: string
}): Promise<void> {
  await pool.query(
    `INSERT INTO trade_executions (position_id, signal_id, direction, tx_hash, status)
     VALUES ($1,$2,$3,$4,$5)`,
    [params.positionId, params.signalId ?? null, params.direction, params.txHash ?? null, params.status]
  )
}

function rowToPosition(row: Record<string, unknown>): Position {
  return {
    id: row.id as string,
    tokenAddress: row.token_address as string,
    pairAddress: row.pair_address as string,
    chain: row.chain as Chain,
    entryPrice: parseFloat(row.entry_price as string),
    size: parseFloat(row.size as string),
    sizeUsd: parseFloat(row.size_usd as string),
    status: row.status as 'open' | 'closed',
    orderId: row.order_id as string | undefined,
    openedAt: row.opened_at as Date,
    closedAt: row.closed_at as Date | undefined,
  }
}
