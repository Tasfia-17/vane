/**
 * Demo mode — no DB, no AVE API keys needed.
 * Simulates a live position with evolving Danger Score so the UI can be shown working.
 * Run with DEMO_MODE=true in .env — never commit this file.
 */
import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'
import { config } from './config'
import type { WsMessage, DangerScore, Holder } from './types'

const DEMO_POSITION = {
  id: 'demo-position-001',
  tokenAddress: '3gWxcrL1KiZp9P6zVgNsiNnF8N3zYw2Vic4usW4ipump',
  pairAddress: 'DemoRaydiumPairAddress1111111111111111111111',
  chain: 'solana' as const,
  entryPrice: 0.00000842,
  size: 11876000,
  sizeUsd: 100,
  status: 'open' as const,
  orderId: 'demo-order-001',
  openedAt: new Date(),
}

const BASE_HOLDERS: Holder[] = [
  { address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', balance: '45200000', percentage: 4.52, is_contract: false, tag: 'Dev Wallet' },
  { address: 'GThUX1Atko4tqhN2NaiTazFAcaPNtRDiBVsKBcAjKrtm', balance: '38100000', percentage: 3.81, is_contract: false },
  { address: 'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh', balance: '29400000', percentage: 2.94, is_contract: false },
  { address: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH', balance: '21000000', percentage: 2.10, is_contract: false },
  { address: 'Fz6LxeUg5qgesYZ2g3M8ntMR4XVBfxVxMFGkYsHZMBnm', balance: '18500000', percentage: 1.85, is_contract: false },
  { address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1bsn', balance: '15200000', percentage: 1.52, is_contract: true, tag: 'Token Program' },
  { address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', balance: '12800000', percentage: 1.28, is_contract: false },
  { address: 'BrEqc6zHVR77jrP6U6WZLUV24AZ9UnHrWfDQTDV7VoDY', balance: '11100000', percentage: 1.11, is_contract: false },
  { address: 'CuieVDEDtLo7FypjyQUsjeadGchQiHttqtXqHnkiLLgc', balance: '9800000',  percentage: 0.98, is_contract: false },
  { address: 'EchDCnKCFBXMKpnFRnMkFqt3QBMoHMkZmFBHnFqt3QBM', balance: '8700000',  percentage: 0.87, is_contract: false },
]

function modeFromScore(score: number): DangerScore['mode'] {
  if (score <= 20) return 'RELAXED'
  if (score <= 40) return 'NORMAL'
  if (score <= 60) return 'ALERT'
  if (score <= 80) return 'WARNING'
  return 'CRITICAL'
}

// Scenario plays out over ~50s then loops
const STEPS = [
  {
    delay: 4000,
    score: 35,
    holderCount: 4821,
    signals: [] as DangerScore['signals'],
    balanceMod: null as null | [number, number], // [holderIndex, multiplier*1000]
    stopEvent: null as null | { pct: number; reason: string },
    tradeEvent: null as null | string,
  },
  {
    delay: 13000,
    score: 52,
    holderCount: 4790,
    signals: [{ type: 'WHALE_SELL' as const, weight: 20, detail: 'Holder GThUX1…rtm sold 18.4% of position', detectedAt: new Date() }],
    balanceMod: [1, 816] as [number, number],
    stopEvent: { pct: 14, reason: 'Whale sell detected — stop tightened to 14%' },
    tradeEvent: null,
  },
  {
    delay: 24000,
    score: 68,
    holderCount: 4640,
    signals: [
      { type: 'WHALE_SELL' as const, weight: 20, detail: 'Holder DfXyg…jh sold 22.1% of position', detectedAt: new Date() },
      { type: 'MULTI_WHALE_SELL' as const, weight: 30, detail: '3 whales sold within 30-minute window', detectedAt: new Date() },
    ],
    balanceMod: [2, 779] as [number, number],
    stopEvent: { pct: 10, reason: 'Multi-whale confluence — stop tightened to 10%' },
    tradeEvent: null,
  },
  {
    delay: 36000,
    score: 91,
    holderCount: 4320,
    signals: [
      { type: 'DEV_WALLET_MOVE' as const, weight: 35, detail: 'Dev wallet 7xKXtg…AsU sold $2,840 — tokens moved to Raydium', detectedAt: new Date() },
      { type: 'HOLDER_COUNT_DROP' as const, weight: 15, detail: 'Holder count dropped 7.2% (4821 → 4474)', detectedAt: new Date() },
    ],
    balanceMod: [0, 310] as [number, number],
    stopEvent: { pct: 6, reason: 'Dev wallet moved to Raydium — HARD EXIT triggered' },
    tradeEvent: '3BP18cjNaU4xpFpTsbZ688mxAcqbev3ReATv8x3Aoir4',
  },
]

export function startDemoServer(): void {
  const wss = new WebSocketServer({ port: config.wsPort })
  let holders = JSON.parse(JSON.stringify(BASE_HOLDERS)) as Holder[]

  const broadcast = (msg: WsMessage) => {
    const data = JSON.stringify(msg)
    for (const c of wss.clients) {
      if (c.readyState === WebSocket.OPEN) c.send(data)
    }
  }

  wss.on('connection', (ws) => {
    console.log('[Demo] Frontend connected — sending initial state')
    // Send current state to new connection immediately
    ws.send(JSON.stringify({ type: 'position:list', payload: [DEMO_POSITION] } satisfies WsMessage))
    ws.send(JSON.stringify({
      type: 'score:update',
      payload: { positionId: DEMO_POSITION.id, score: 35, mode: 'NORMAL', signals: [], computedAt: new Date() },
    } satisfies WsMessage))
    ws.send(JSON.stringify({
      type: 'holder:update',
      payload: { tokenAddress: DEMO_POSITION.tokenAddress, top10Pct: 19.98, holderCount: 4821, topHolders: holders },
    } satisfies WsMessage))
  })

  const runLoop = () => {
    holders = JSON.parse(JSON.stringify(BASE_HOLDERS))

    for (const step of STEPS) {
      setTimeout(() => {
        // Mutate holder balance if needed
        if (step.balanceMod) {
          const [idx, mult] = step.balanceMod
          holders = holders.map((h, i) =>
            i === idx ? { ...h, balance: String(Math.round(parseInt(h.balance) * mult / 1000)) } : h
          )
        }

        const mode = modeFromScore(step.score)

        broadcast({
          type: 'score:update',
          payload: {
            positionId: DEMO_POSITION.id,
            score: step.score,
            mode,
            signals: step.signals.map(s => ({ ...s, detectedAt: new Date() })),
            computedAt: new Date(),
          },
        })

        broadcast({
          type: 'holder:update',
          payload: {
            tokenAddress: DEMO_POSITION.tokenAddress,
            top10Pct: holders.slice(0, 10).reduce((s, h) => s + h.percentage, 0),
            holderCount: step.holderCount,
            topHolders: holders,
          },
        })

        if (step.stopEvent) {
          setTimeout(() => broadcast({
            type: 'stop:adjusted',
            payload: { positionId: DEMO_POSITION.id, newStopPct: step.stopEvent!.pct, reason: step.stopEvent!.reason },
          }), 700)
        }

        if (step.tradeEvent) {
          setTimeout(() => broadcast({
            type: 'trade:executed',
            payload: { positionId: DEMO_POSITION.id, txHash: step.tradeEvent!, tradeType: 'hard_exit' },
          }), 2000)
        }
      }, step.delay)
    }

    // Loop after last step + 8s pause
    setTimeout(runLoop, STEPS[STEPS.length - 1].delay + 8000)
  }

  runLoop()

  // Minimal HTTP server — no DB
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
    if (req.url === '/health') return void res.end(JSON.stringify({ ok: true, mode: 'demo' }))
    if (req.url === '/positions') return void res.end(JSON.stringify([DEMO_POSITION]))
    res.writeHead(404); res.end('{}')
  })

  server.listen(config.port, () => {
    console.log('\n🌬️  VANE demo mode')
    console.log(`   HTTP  → http://localhost:${config.port}`)
    console.log(`   WS    → ws://localhost:${config.wsPort}`)
    console.log('   Open  → http://localhost:3000\n')
    console.log('   Scenario: NORMAL → ALERT → WARNING → CRITICAL → loops every ~50s\n')
  })
}
