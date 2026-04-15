import http from 'http'
import { EventEmitter } from 'eventemitter3'
import { getOpenPositions, insertPosition, closePosition, pool, rowToPosition } from '../db/queries'
import { getRisk, getTokenPrice } from '../api/dataClient'
import { createSwapOrder, cancelOrder } from '../api/tradeClient'
import { registerDevWallet } from '../services/scoreManager'
import { config } from '../config'
import type { BusEvents, Position } from '../types'

const NATIVE_ADDRESS: Record<string, string> = {
  solana: 'sol',
  eth: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  bsc: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  base: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
}

const NATIVE_DECIMALS: Record<string, number> = {
  solana: 9, eth: 18, bsc: 18, base: 18,
}

// Fetch native token price to convert USD -> native units for buy orders
async function getNativePrice(chain: string): Promise<number> {
  const nativeTokens: Record<string, string> = {
    solana: 'So11111111111111111111111111111111111111112',
    eth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    bsc: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    base: '0x4200000000000000000000000000000000000006',
  }
  try {
    return await getTokenPrice(nativeTokens[chain] ?? '', chain)
  } catch {
    const fallback: Record<string, number> = { solana: 140, eth: 3000, bsc: 600, base: 3000 }
    return fallback[chain] ?? 1
  }
}

function json(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(data))
}

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => { try { resolve(JSON.parse(body)) } catch { reject(new Error('Invalid JSON')) } })
  })
}

export function startHttpServer(
  bus: EventEmitter<BusEvents>,
  positions: Map<string, Position>
): http.Server {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url!, `http://localhost`)

    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' })
      res.end()
      return
    }

    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        return json(res, 200, { ok: true, positions: positions.size })
      }

      if (req.method === 'GET' && url.pathname === '/positions') {
        const status = url.searchParams.get('status') ?? 'open'
        const rows = status === 'closed'
          ? await pool.query(`SELECT * FROM positions WHERE status='closed' ORDER BY closed_at DESC LIMIT 100`).then(r => r.rows.map(rowToPosition))
          : await getOpenPositions()
        return json(res, 200, rows)
      }

      if (req.method === 'POST' && url.pathname === '/positions') {
        const body = await readBody(req) as {
          tokenAddress: string
          pairAddress: string
          chain: string
          inAmountUsd: number
        }

        if (!body.tokenAddress || !body.pairAddress || !body.chain || !body.inAmountUsd) {
          return json(res, 400, { error: 'tokenAddress, pairAddress, chain, inAmountUsd are required' })
        }

        const risk = await getRisk(body.tokenAddress, body.chain)
        if (risk.honeypot) return json(res, 400, { error: 'Token is a honeypot' })
        if (risk.risk_level === 'CRITICAL') return json(res, 400, { error: `Token risk is CRITICAL (score: ${risk.risk_score})` })
        if (risk.owner) registerDevWallet(body.tokenAddress, risk.owner)

        const entryPrice = await getTokenPrice(body.tokenAddress, body.chain)

        // inAmount = native token units we spend (SOL lamports, ETH wei)
        const nativePrice = await getNativePrice(body.chain)
        const nativeAmount = body.inAmountUsd / nativePrice
        const decimals = NATIVE_DECIMALS[body.chain] ?? 18
        const inAmount = String(Math.round(nativeAmount * Math.pow(10, decimals)))
        const native = NATIVE_ADDRESS[body.chain] ?? 'sol'

        const orderId = await createSwapOrder({
          chain: body.chain,
          inTokenAddress: native,
          outTokenAddress: body.tokenAddress,
          inAmount,
          swapType: 'buy',
          autoSellConfig: [
            { priceChange: '-2000', sellRatio: '10000', type: 'default' },
            { priceChange: '5000',  sellRatio: '5000',  type: 'default' },
            { priceChange: '10000', sellRatio: '5000',  type: 'default' },
            { priceChange: '2000',  sellRatio: '10000', type: 'trailing' },
          ],
        })

        const pos = await insertPosition({
          tokenAddress: body.tokenAddress,
          pairAddress: body.pairAddress,
          chain: body.chain as Position['chain'],
          entryPrice,
          size: body.inAmountUsd / entryPrice,
          sizeUsd: body.inAmountUsd,
          status: 'open',
          orderId,
        })

        positions.set(pos.id, pos)
        return json(res, 201, pos)
      }

      if (req.method === 'DELETE' && url.pathname.startsWith('/positions/')) {
        const id = url.pathname.split('/')[2]
        const pos = positions.get(id)
        if (!pos) return json(res, 404, { error: 'Position not found' })

        if (pos.orderId) {
          try { await cancelOrder(pos.chain, pos.orderId) } catch { /* already filled */ }
        }

        await closePosition(id)
        positions.delete(id)
        return json(res, 200, { ok: true })
      }

      json(res, 404, { error: 'Not found' })
    } catch (err) {
      console.error('[HTTP]', err)
      json(res, 500, { error: String(err) })
    }
  })

  server.listen(config.port, () => console.log(`[HTTP] Listening on http://localhost:${config.port}`))
  return server
}
