import 'dotenv/config'

export const config = {
  aveApiKey: process.env.AVE_API_KEY!,
  aveAccessKey: process.env.AVE_ACCESS_KEY!,
  aveSecretKey: process.env.AVE_SECRET_KEY!,
  aveAssetsId: process.env.AVE_ASSETS_ID!,
  apiPlan: (process.env.API_PLAN ?? 'free') as 'free' | 'normal' | 'pro',
  databaseUrl: process.env.DATABASE_URL!,
  wsPort: parseInt(process.env.WS_PORT ?? '8080'),
  port: parseInt(process.env.PORT ?? '3001'),

  // AVE endpoints
  dataApiBase: 'https://data.ave-api.xyz/v2',
  dataWssUrl: 'wss://wss.ave-api.xyz',
  tradeApiBase: 'https://bot-api.ave.ai',
  tradeWssUrl: `wss://bot-api.ave.ai/thirdws?ave_access_key=${process.env.AVE_ACCESS_KEY}`,

  // Signal thresholds
  holderPollIntervalMs: 60_000,
  whaleSellThresholdPct: 5,       // >5% of their holdings sold = WHALE_SELL
  multiWhaleCount: 3,             // 3+ whales selling in window = MULTI_WHALE_SELL
  multiWhaleWindowMs: 30 * 60_000,
  holderCountDropPct: 5,          // >5% drop in 24h = HOLDER_COUNT_DROP
  whaleBuyThresholdPct: 3,        // >3% increase = WHALE_BUY
}
