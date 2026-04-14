import { create } from 'zustand'
import type { Position, DangerScore, Holder } from '@/lib/types'

interface PositionState {
  positions: Position[]
  scores: Record<string, DangerScore>          // positionId → latest score
  holders: Record<string, Holder[]>            // tokenAddress → top holders
  holderCounts: Record<string, number>         // tokenAddress → count
  top10Pcts: Record<string, number>            // tokenAddress → top10%
  events: Array<{ positionId: string; message: string; time: string }>
  wsConnected: boolean

  setPositions: (positions: Position[]) => void
  updateScore: (score: DangerScore) => void
  updateHolders: (tokenAddress: string, holders: Holder[], count: number, top10Pct: number) => void
  addEvent: (positionId: string, message: string) => void
  setWsConnected: (v: boolean) => void
}

export const useStore = create<PositionState>((set) => ({
  positions: [],
  scores: {},
  holders: {},
  holderCounts: {},
  top10Pcts: {},
  events: [],
  wsConnected: false,

  setPositions: (positions) => set({ positions }),

  updateScore: (score) =>
    set((s) => ({ scores: { ...s.scores, [score.positionId]: score } })),

  updateHolders: (tokenAddress, holders, count, top10Pct) =>
    set((s) => ({
      holders: { ...s.holders, [tokenAddress]: holders },
      holderCounts: { ...s.holderCounts, [tokenAddress]: count },
      top10Pcts: { ...s.top10Pcts, [tokenAddress]: top10Pct },
    })),

  addEvent: (positionId, message) =>
    set((s) => ({
      events: [
        { positionId, message, time: new Date().toISOString() },
        ...s.events.slice(0, 49),  // keep last 50
      ],
    })),

  setWsConnected: (wsConnected) => set({ wsConnected }),
}))
