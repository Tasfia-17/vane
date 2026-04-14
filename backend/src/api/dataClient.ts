import { config } from '../config'
import type { AveResponse, Holder, RiskData } from '../types'

const headers = { 'X-API-KEY': config.aveApiKey }

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${config.dataApiBase}${path}`, { headers })
  if (!res.ok) throw new Error(`AVE Data API ${res.status}: ${path}`)
  const json = await res.json() as AveResponse<T>
  if (json.status !== 1) throw new Error(`AVE Data API error: ${json.msg}`)
  return json.data
}

// AVE /tokens/holders returns { list: [...], total: N } or a flat array depending on version
// We normalise both shapes here
export async function getTopHolders(tokenAddress: string, chain: string): Promise<Holder[]> {
  const data = await get<unknown>(`/tokens/holders/${tokenAddress}-${chain}?limit=100&sort_by=balance&order=desc`)

  // Shape 1: { list: Holder[] }
  if (data && typeof data === 'object' && 'list' in data && Array.isArray((data as { list: unknown }).list)) {
    return (data as { list: Holder[] }).list
  }
  // Shape 2: { holders: Holder[] }
  if (data && typeof data === 'object' && 'holders' in data && Array.isArray((data as { holders: unknown }).holders)) {
    return (data as { holders: Holder[] }).holders
  }
  // Shape 3: flat array
  if (Array.isArray(data)) return data as Holder[]

  throw new Error(`Unexpected holders response shape: ${JSON.stringify(data).slice(0, 200)}`)
}

export async function getRisk(tokenAddress: string, chain: string): Promise<RiskData> {
  return get<RiskData>(`/contracts/${tokenAddress}-${chain}`)
}

// AVE token detail endpoint returns a large object — we extract price_usd defensively
export async function getTokenPrice(tokenAddress: string, chain: string): Promise<number> {
  const data = await get<Record<string, unknown>>(`/tokens/${tokenAddress}-${chain}`)

  // Try common field names AVE uses
  const price =
    (data.price_usd as number | undefined) ??
    (data.priceUsd as number | undefined) ??
    (data.price as number | undefined) ??
    ((data.token as Record<string, unknown> | undefined)?.price_usd as number | undefined)

  if (!price || isNaN(price)) {
    throw new Error(`Could not extract price from token response: ${JSON.stringify(data).slice(0, 200)}`)
  }
  return price
}
