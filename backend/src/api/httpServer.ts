import http from 'http'
import { EventEmitter } from 'eventemitter3'
import { getOpenPositions, insertPosition, closePosition } from '../db/queries'
import { getRisk, getTokenPrice } from '../api/dataClient'
import { createSwapOrder } from '../api/tradeClient'
import { registerDevWallet } from '../services/scoreManager'
import { config } from '../config'
import type { BusEvents, Position, WsMessage } from '../types'

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
      // GET /health
      if (req.method === 'GET' && url.pathname === '/health') {
        return json(res, 200, { ok: true, positions: positions.size })
      }

      // GET /positions
      if (req.method === 'GET' && url.pathname === '/positions') {
        const rows = await getOpenPositions()
        return json(res, 200, rows)
      }

      // POST /positions — open a new position
      if (req.method === 'POST' && url.pathname === '/positions') {
        const body = await readBody(req) as {
          tokenAddress: string
          pairAddress: string
          chain: string
          inAmountUsd: number
        }

        // 1. Risk check
        const risk = await getRisk(body.tokenAddress, body.chain)
        if (risk.honeypot) return json(res, 400, { error: 'Token is a honeypot — cannot open position' })
        if (risk.risk_level === 'CRITICAL') return json(res, 400, { error: `Token risk is CRITICAL (score: ${risk.risk_score})` })

        // Register dev wallet from risk data
        if (risk.owner) registerDevWallet(body.tokenAddress, risk.owner)

        // 2. Get current price
        const entryPrice = await getTokenPrice(body.tokenAddress, body.chain)

        // 3. Create proxy wallet order with default stops
        const inAmountLamports = String(Math.round(body.inAmountUsd * 1e6))
        const orderId = await createSwapOrder({
          chain: body.chain,
          inTokenAddress: 'sol',
          outTokenAddress: body.tokenAddress,
          inAmount: inAmountLamports,
          swapType: 'buy',
          autoSellConfig: [
            { priceChange: '-2000', sellRatio: '10000', type: 'default' },   // -20% stop loss
            { priceChange: '5000', sellRatio: '5000', type: 'default' },     // +50% take 50%
            { priceChange: '10000', sellRatio: '5000', type: 'default' },    // +100% take rest
            { priceChange: '2000', sellRatio: '10000', type: 'trailing' },   // 20% trailing
          ],
        })

        // 4. Save to DB
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

      // DELETE /positions/:id — close position manually
      if (req.method === 'DELETE' && url.pathname.startsWith('/positions/')) {
        const id = url.pathname.split('/')[2]
        const pos = positions.get(id)
        if (!pos) return json(res, 404, { error: 'Position not found' })

        // Cancel AVE order if one exists
        if (pos.orderId) {
          try { await (await import('../api/tradeClient')).cancelOrder(pos.chain, pos.orderId) }
          catch { /* order may already be filled */ }
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
