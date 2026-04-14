import { useStore } from '@/store/useStore'

const API = process.env.NEXT_PUBLIC_API_URL!

export function usePositions() {
  const { positions, setPositions } = useStore()

  const load = async () => {
    const res = await fetch(`${API}/positions`)
    const data = await res.json()
    setPositions(data)
  }

  const open = async (params: {
    tokenAddress: string
    pairAddress: string
    chain: string
    inAmountUsd: number
  }) => {
    const res = await fetch(`${API}/positions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Failed to open position')
    }
    const newPos = await res.json()
    // Optimistically add to store, then sync
    useStore.getState().setPositions([...useStore.getState().positions, newPos])
    await load()
  }

  const close = async (id: string) => {
    await fetch(`${API}/positions/${id}`, { method: 'DELETE' })
    await load()
  }

  return { positions, load, open, close }
}
