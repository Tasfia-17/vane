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

const CHAINS = [
  { id: 'solana', label: 'Solana' },
  { id: 'eth',    label: 'Ethereum' },
  { id: 'bsc',    label: 'BNB Chain' },
  { id: 'base',   label: 'Base' },
]

const AMOUNTS = [50, 100, 250, 500]

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
      await onOpen({ ...form, inAmountUsd: parseFloat(form.inAmountUsd) })
      setOpen(false)
      setForm({ tokenAddress: '', pairAddress: '', chain: 'solana', inAmountUsd: '100' })
    } catch (err) {
      setError(String(err).replace('Error: ', ''))
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-slate-700/60 hover:border-slate-500 py-5 text-slate-600 hover:text-slate-400 text-sm transition-all hover:bg-slate-800/20 group"
      >
        <span className="group-hover:scale-110 inline-block transition-transform mr-2 text-base">+</span>
        Open new position
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="glass rounded-2xl overflow-hidden slide-in">
      {/* Form header */}
      <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Open Position</h3>
          <p className="text-xs text-slate-500 mt-0.5">VANE will run a honeypot check before placing the order</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-400 text-lg leading-none transition-colors">
          ×
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Chain selector */}
        <div>
          <label className="text-xs text-slate-500 font-mono tracking-widest uppercase block mb-2">Chain</label>
          <div className="grid grid-cols-4 gap-2">
            {CHAINS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, chain: c.id }))}
                className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                  form.chain === c.id
                    ? 'bg-slate-200 text-slate-900 border-slate-200'
                    : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Addresses */}
        {[
          { key: 'tokenAddress', label: 'Token Address', placeholder: 'Token contract address' },
          { key: 'pairAddress',  label: 'Pair Address',  placeholder: 'DEX pair address (from DEX Screener)' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs text-slate-500 font-mono tracking-widest uppercase block mb-2">{label}</label>
            <input
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
              placeholder={placeholder}
              value={form[key as keyof typeof form]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              required
            />
          </div>
        ))}

        {/* Amount */}
        <div>
          <label className="text-xs text-slate-500 font-mono tracking-widest uppercase block mb-2">Amount (USD)</label>
          <div className="flex gap-2 mb-2">
            {AMOUNTS.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setForm(f => ({ ...f, inAmountUsd: String(a) }))}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  form.inAmountUsd === String(a)
                    ? 'bg-slate-200 text-slate-900 border-slate-200'
                    : 'bg-slate-800/50 text-slate-500 border-slate-700 hover:border-slate-500'
                }`}
              >
                ${a}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="1"
            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-slate-500 transition-colors"
            value={form.inAmountUsd}
            onChange={e => setForm(f => ({ ...f, inAmountUsd: e.target.value }))}
            required
          />
        </div>

        {/* Default stops info */}
        <div className="bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/40">
          <p className="text-xs text-slate-500 mb-2 font-mono tracking-widest uppercase">Default Stops</p>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><span className="text-slate-600">Stop loss</span><br/><span className="text-red-400 font-semibold">-20%</span></div>
            <div><span className="text-slate-600">Take profit</span><br/><span className="text-emerald-400 font-semibold">+50% / +100%</span></div>
            <div><span className="text-slate-600">Trailing</span><br/><span className="text-blue-400 font-semibold">20% drawdown</span></div>
          </div>
          <p className="text-xs text-slate-600 mt-2">VANE adjusts these automatically based on holder signals.</p>
        </div>

        {error && (
          <div className="slide-in bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold text-sm rounded-xl py-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
              Checking token...
            </span>
          ) : 'Open with VANE stops'}
        </button>
      </div>
    </form>
  )
}
