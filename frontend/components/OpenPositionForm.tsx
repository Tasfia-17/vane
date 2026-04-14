'use client'
import { useState } from 'react'

interface Props {
  onOpen: (params: {
    tokenAddress: string
    pairAddress: string
    chain: string
    inAmountUsd: number
  }) => Promise<void>
}

const CHAINS = ['solana', 'eth', 'bsc', 'base']

export function OpenPositionForm({ onOpen }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    tokenAddress: '',
    pairAddress: '',
    chain: 'solana',
    inAmountUsd: '100',
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onOpen({
        ...form,
        inAmountUsd: parseFloat(form.inAmountUsd),
      })
      setOpen(false)
      setForm({ tokenAddress: '', pairAddress: '', chain: 'solana', inAmountUsd: '100' })
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border-2 border-dashed border-slate-700 hover:border-slate-500 py-4 text-slate-500 hover:text-slate-300 text-sm transition-colors"
      >
        + Open position
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-700 bg-slate-900 p-5 space-y-3">
      <div className="text-sm text-slate-300 font-medium mb-1">Open position</div>

      {[
        { key: 'tokenAddress', label: 'Token address', placeholder: '0x… or pump.fun address' },
        { key: 'pairAddress', label: 'Pair address', placeholder: 'DEX pair address' },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="text-xs text-slate-500 block mb-1">{label}</label>
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-slate-500"
            placeholder={placeholder}
            value={form[key as keyof typeof form]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            required
          />
        </div>
      ))}

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-slate-500 block mb-1">Chain</label>
          <select
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
            value={form.chain}
            onChange={e => setForm(f => ({ ...f, chain: e.target.value }))}
          >
            {CHAINS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-500 block mb-1">Amount (USD)</label>
          <input
            type="number"
            min="1"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
            value={form.inAmountUsd}
            onChange={e => setForm(f => ({ ...f, inAmountUsd: e.target.value }))}
            required
          />
        </div>
      </div>

      {error && <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</div>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-slate-200 hover:bg-white text-slate-900 font-semibold text-sm rounded-lg py-2 transition-colors disabled:opacity-50"
        >
          {loading ? 'Opening…' : 'Open with Vane stops'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
