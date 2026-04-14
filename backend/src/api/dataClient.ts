import { config } from '../config'
import type { AveResponse, Holder, HoldersData, RiskData } from '../types'

const headers = { 'X-API-KEY': config.aveApiKey }

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${config.dataApiBase}${path}`, { headers })
  if (!res.ok) throw new Error(`AVE Data API ${res.status}: ${path}`)
  const json = await res.json() as AveResponse<T>
  if (json.status !== 1) throw new Error(`AVE Data API error: ${json.msg}`)
  return json.data
}

export async function getTopHolders(tokenAddress: string, chain: string): Promise<Holder[]> {
  const data = await get<HoldersData>(`/tokens/holders/${tokenAddress}-${chain}?limit=100&sort_by=balance&order=desc`)
  return data.holders
}

export async function getRisk(tokenAddress: string, chain: string): Promise<RiskData> {
  return get<RiskData>(`/contracts/${tokenAddress}-${chain}`)
}

export async function getTokenPrice(tokenAddress: string, chain: string): Promise<number> {
  const data = await get<{ price_usd: number }>(`/tokens/${tokenAddress}-${chain}`)
  return data.price_usd
}
