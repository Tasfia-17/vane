import { create } from 'zustand'
import type { Position, DangerScore, Holder } from '@/lib/types'

interface Event {
  positionId: string
  message: string
  time: string
}

interface PositionState {
  positions: Position[]
  scores: Record<string, DangerScore>
  scoreHistory: Record<string, number[]>        // positionId → last 12 scores
  holders: Record<string, Holder[]>
  holderCounts: Record<string, number>
  top10Pcts: Record<string, number>
  currentPrices: Record<string, number>         // tokenAddress → latest price
  events: Event[]
  wsConnected: boolean

  setPositions: (positions: Position[]) => void
  updateScore: (score: DangerScore) => void
  updateHolders: (tokenAddress: string, holders: Holder[], count: number, top10Pct: number) => void
  updatePrice: (tokenAddress: string, price: number) => void
  addEvent: (positionId: string, message: string) => void
  setWsConnected: (v: boolean) => void
}

export const useStore = create<PositionState>((set) => ({
  positions: [],
  scores: {},
  scoreHistory: {},
  holders: {},
  holderCounts: {},
  top10Pcts: {},
  currentPrices: {},
  events: [],
  wsConnected: false,

  setPositions: (positions) => set({ positions }),

  updateScore: (score) =>
    set((s) => ({
      scores: { ...s.scores, [score.positionId]: score },
      scoreHistory: {
        ...s.scoreHistory,
        [score.positionId]: [...(s.scoreHistory[score.positionId] ?? []).slice(-11), score.score],
      },
    })),

  updateHolders: (tokenAddress, holders, count, top10Pct) =>
    set((s) => ({
      holders: { ...s.holders, [tokenAddress]: holders },
      holderCounts: { ...s.holderCounts, [tokenAddress]: count },
      top10Pcts: { ...s.top10Pcts, [tokenAddress]: top10Pct },
    })),

  updatePrice: (tokenAddress, price) =>
    set((s) => ({ currentPrices: { ...s.currentPrices, [tokenAddress]: price } })),

  addEvent: (positionId, message) =>
    set((s) => ({
      events: [
        { positionId, message, time: new Date().toISOString() },
        ...s.events.slice(0, 49),
      ],
    })),

  setWsConnected: (wsConnected) => set({ wsConnected }),
}))
