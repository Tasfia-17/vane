'use client'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL!

export default function Settings() {
  const [saved, setSaved] = useState(false)
  const [defaults, setDefaults] = useState({
    stopLossBps: '2000',
    tp1Bps: '5000',
    tp1Ratio: '5000',
    tp2Bps: '10000',
    tp2Ratio: '5000',
    trailingBps: '2000',
    slippage: '500',
  })

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    // Persisted locally for now — backend would read these on next position open
    localStorage.setItem('vane_defaults', JSON.stringify(defaults))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const field = (key: keyof typeof defaults, label: string, hint: string) => (
    <div key={key}>
      <label className="text-xs text-slate-500 font-mono tracking-widest uppercase block mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="w-32 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-slate-500 transition-colors"
          value={defaults[key]}
          onChange={e => setDefaults(d => ({ ...d, [key]: e.target.value }))}
        />
        <span className="text-xs text-slate-600">{hint}</span>
      </div>
    </div>
  )

  return (
    <main className="max-w-2xl mx-auto px-6 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-100">Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Default stop parameters applied when opening a new position</p>
      </div>

      <form onSubmit={save} className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50">
          <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">Default Stop Configuration</span>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            {field('stopLossBps',  'Stop Loss',       'bps (2000 = 20%)')}
            {field('trailingBps',  'Trailing Stop',   'bps drawdown from peak')}
            {field('tp1Bps',       'Take Profit 1',   'bps gain to trigger')}
            {field('tp1Ratio',     'TP1 Sell Ratio',  'bps of position (5000 = 50%)')}
            {field('tp2Bps',       'Take Profit 2',   'bps gain to trigger')}
            {field('tp2Ratio',     'TP2 Sell Ratio',  'bps of position')}
          </div>
          {field('slippage', 'Default Slippage', 'bps (500 = 5%)')}

          <div className="bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/40 text-xs text-slate-500">
            VANE adjusts stop loss dynamically based on the Danger Score. These values are the starting point before any signal-based adjustment.
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-slate-200 hover:bg-white text-slate-900 font-bold text-sm rounded-xl transition-all"
          >
            {saved ? 'Saved!' : 'Save Defaults'}
          </button>
        </div>
      </form>

      {/* Connection info */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50">
          <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">Connection</span>
        </div>
        <div className="p-5 space-y-3 text-xs font-mono">
          {[
            { label: 'Backend API', value: API },
            { label: 'WebSocket',   value: process.env.NEXT_PUBLIC_WS_URL },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-slate-500">{label}</span>
              <span className="text-slate-300">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
