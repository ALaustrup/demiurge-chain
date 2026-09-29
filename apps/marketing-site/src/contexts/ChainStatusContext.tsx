'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface ChainStatus {
  status: 'online' | 'offline' | 'checking'
  blockNumber: number | null
  latency: number | null
  lastChecked: Date | null
}

interface ChainStatusContextType extends ChainStatus {
  refresh: () => Promise<void>
}

const ChainStatusContext = createContext<ChainStatusContextType>({
  status: 'checking',
  blockNumber: null,
  latency: null,
  lastChecked: null,
  refresh: async () => {},
})

export function ChainStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const [blockNumber, setBlockNumber] = useState<number | null>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkChainStatus = async () => {
    const startTime = Date.now()
    try {
      const response = await fetch('/api/chain/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const endTime = Date.now()
      const responseLatency = endTime - startTime

      if (!response.ok) {
        setStatus('offline')
        setLatency(null)
        setBlockNumber(null)
        setLastChecked(new Date())
        return
      }

      const data = await response.json()

      if (data.isOnline || data.status === 'connected') {
        setStatus('online')
        setBlockNumber(data.blockNumber || data.blockHeight || null)
        setLatency(responseLatency)
      } else {
        setStatus('offline')
        setLatency(null)
        setBlockNumber(null)
      }

      setLastChecked(new Date())
    } catch (error) {
      console.error('Chain status check failed:', error)
      setStatus('offline')
      setLatency(null)
      setBlockNumber(null)
      setLastChecked(new Date())
    }
  }

  useEffect(() => {
    checkChainStatus()
    const interval = setInterval(checkChainStatus, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <ChainStatusContext.Provider
      value={{
        status,
        blockNumber,
        latency,
        lastChecked,
        refresh: checkChainStatus,
      }}
    >
      {children}
    </ChainStatusContext.Provider>
  )
}

export function useChainStatus() {
  return useContext(ChainStatusContext)
}
