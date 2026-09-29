'use client'

import { useChainStatus } from '@/contexts/ChainStatusContext'
import { Activity, AlertCircle, CheckCircle } from 'lucide-react'

export function ChainStatusBanner() {
  const { status, blockNumber, latency } = useChainStatus()

  const getStatusColor = () => {
    if (status === 'online') return 'text-neon-green'
    if (status === 'offline') return 'text-red-500'
    return 'text-yellow-500'
  }

  const getStatusIcon = () => {
    if (status === 'online') return <CheckCircle className="w-4 h-4" />
    if (status === 'offline') return <AlertCircle className="w-4 h-4" />
    return <Activity className="w-4 h-4 animate-pulse" />
  }

  return (
    <div className={`bg-blockchain-light border-b border-${status === 'online' ? 'neon-green' : status === 'offline' ? 'red-500' : 'yellow-500'}/30 py-2 px-4`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <span className={`font-medium ${getStatusColor()}`}>
            Chain Status: {status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Checking...'}
          </span>
          {status === 'online' && blockNumber !== null && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-gray-300">Block #{blockNumber.toLocaleString()}</span>
            </>
          )}
          {status === 'online' && latency !== null && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-gray-300">{latency}ms latency</span>
            </>
          )}
        </div>
        {status === 'offline' && (
          <span className="text-gray-400 text-xs">Chain services temporarily unavailable</span>
        )}
      </div>
    </div>
  )
}
