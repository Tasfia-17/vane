'use client'
import { useEffect } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { usePositions } from '@/hooks/usePositions'
import { Nav } from './Nav'

// AppShell mounts WebSocket and loads positions once, globally across all pages
export function AppShell({ children }: { children: React.ReactNode }) {
  useWebSocket()
  const { load } = usePositions()
  useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen bg-[#020817]">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(51,65,85,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(51,65,85,0.06)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      <Nav />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
