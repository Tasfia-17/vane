import crypto from 'crypto'
import { config } from '../config'
import type { SwapOrderResponse } from '../types'

function sign(method: string, path: string, body: object): Record<string, string> {
  const timestamp = new Date().toISOString()
  // AVE spec: sort keys, no spaces — JSON.stringify replacer must be an array of keys
  const sortedKeys = Object.keys(body).sort()
  const sortedBody = JSON.stringify(body, sortedKeys).replace(/\s/g, '')
  const message = timestamp + method.toUpperCase() + path + sortedBody
  const signature = crypto
    .createHmac('sha256', config.aveSecretKey)
    .update(message)
    .digest('base64')
  return {
    'AVE-ACCESS-KEY': config.aveAccessKey,
    'AVE-ACCESS-TIMESTAMP': timestamp,
    'AVE-ACCESS-SIGN': signature,
    'Content-Type': 'application/json',
  }
}

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${config.tradeApiBase}${path}`, {
    method: 'POST',
    headers: sign('POST', path, body),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`AVE Trade API ${res.status}: ${path}`)
  const json = await res.json() as { status: number; msg: string } & T
  if (json.status !== 0) throw new Error(`AVE Trade API error: ${json.msg}`)
  return json
}

export interface AutoSellRule {
  priceChange: string   // bps, negative = stop-loss, positive = take-profit
  sellRatio: string     // bps of tokens to sell (10000 = 100%)
  type: 'default' | 'trailing'
}

export async function createSwapOrder(params: {
  chain: string
  inTokenAddress: string
  outTokenAddress: string
  inAmount: string
  swapType: 'buy' | 'sell'
  slippage?: string
  autoSellConfig?: AutoSellRule[]
}): Promise<string> {
  const body = {
    chain: params.chain,
    assetsId: config.aveAssetsId,
    inTokenAddress: params.inTokenAddress,
    outTokenAddress: params.outTokenAddress,
    inAmount: params.inAmount,
    swapType: params.swapType,
    slippage: params.slippage ?? '500',
    useMev: true,
    autoSlippage: true,
    autoGas: 'average',
    ...(params.autoSellConfig ? { autoSellConfig: params.autoSellConfig } : {}),
  }
  const res = await post<SwapOrderResponse>('/v1/thirdParty/tx/sendSwapOrder', body)
  return res.data.id
}

export async function cancelOrder(chain: string, orderId: string): Promise<void> {
  await post('/v1/thirdParty/tx/cancelLimitOrder', { chain, ids: [orderId] })
}

export async function getOrderStatus(orderId: string): Promise<{ status: string; txHash?: string }> {
  const res = await fetch(
    `${config.tradeApiBase}/v1/thirdParty/tx/getSwapOrder?id=${orderId}`,
    { headers: { 'AVE-ACCESS-KEY': config.aveAccessKey } }
  )
  const json = await res.json() as { data?: { status?: string; txHash?: string } }
  return { status: json.data?.status ?? 'unknown', txHash: json.data?.txHash }
}
