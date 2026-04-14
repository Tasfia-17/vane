import { Pool } from 'pg'
import { config } from '../config'

export const pool = new Pool({ connectionString: config.databaseUrl })

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token_address VARCHAR(100) NOT NULL,
      pair_address VARCHAR(100) NOT NULL,
      chain VARCHAR(20) NOT NULL,
      entry_price NUMERIC(30,10) NOT NULL,
      size NUMERIC(30,10) NOT NULL,
      size_usd NUMERIC(20,4) NOT NULL,
      status VARCHAR(10) NOT NULL DEFAULT 'open',
      order_id VARCHAR(100),
      opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      closed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS holder_snapshots (
      id BIGSERIAL PRIMARY KEY,
      token_address VARCHAR(100) NOT NULL,
      chain VARCHAR(20) NOT NULL,
      holder_count INT NOT NULL,
      top10_pct NUMERIC(6,3) NOT NULL,
      holders_json JSONB NOT NULL,
      snapshotted_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_holder_snap ON holder_snapshots (token_address, chain, snapshotted_at DESC);

    CREATE TABLE IF NOT EXISTS signal_events (
      id BIGSERIAL PRIMARY KEY,
      position_id UUID REFERENCES positions(id),
      score NUMERIC(5,2) NOT NULL,
      mode VARCHAR(10) NOT NULL,
      signals JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_signal_pos ON signal_events (position_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS trade_executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      position_id UUID REFERENCES positions(id),
      signal_id BIGINT REFERENCES signal_events(id),
      direction VARCHAR(4) NOT NULL,
      price NUMERIC(30,10),
      size_usd NUMERIC(20,4),
      tx_hash VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
}
