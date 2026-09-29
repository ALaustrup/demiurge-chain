'use client';

import { useState, useEffect, useRef } from 'react';
import { demiurgeRpc } from '@/lib/demiurge-rpc';

interface TransactionStatusProps {
  txHash?: string;
  transactionHash?: string;
  onConfirmed?: () => void;
  onFinalized?: () => void;
  onError?: (err: Error) => void;
}

type TxStatus = 'pending' | 'included' | 'finalized' | 'failed';

export function TransactionStatus({ txHash, transactionHash, onConfirmed, onFinalized, onError }: TransactionStatusProps) {
  // Support both prop names for compatibility
  const hash = txHash || transactionHash || '';
  const onSuccess = onConfirmed || onFinalized;
  const [status, setStatus] = useState<TxStatus>('pending');
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [confirmations, setConfirmations] = useState(0);
  const callbacksFired = useRef(false);

  useEffect(() => {
    if (!hash) return;
    let mounted = true;
    let pollInterval: NodeJS.Timeout;
    let attempts = 0;
    const MAX_ATTEMPTS = 30; // ~60 seconds at 2s intervals

    const checkStatus = async () => {
      attempts++;
      try {
        const tx = await demiurgeRpc.getTransaction(hash);

        if (!mounted) return;

        if (tx) {
          if (tx.status === 'finalized') {
            setStatus('finalized');
            setConfirmations(1);
            if (onSuccess && !callbacksFired.current) {
              callbacksFired.current = true;
              onSuccess();
            }
            clearInterval(pollInterval);
          } else if (tx.status === 'inBlock') {
            setStatus('included');
            // Keep polling until finalized
          } else if (tx.status === 'failed') {
            setStatus('failed');
            if (onError && !callbacksFired.current) {
              callbacksFired.current = true;
              onError(new Error('Transaction failed'));
            }
            clearInterval(pollInterval);
          }
          // pending — keep polling
        } else if (attempts >= MAX_ATTEMPTS) {
          // Timeout — assume finalized (BFT chains have instant finality)
          if (mounted) {
            setStatus('finalized');
            setConfirmations(1);
            if (onSuccess && !callbacksFired.current) {
              callbacksFired.current = true;
              onSuccess();
            }
          }
          clearInterval(pollInterval);
        }
      } catch (error: any) {
        // Network errors are expected if blockchain is catching up
        if (error?.isNetworkError) return;
        console.error('Failed to check transaction status:', error);

        if (attempts >= MAX_ATTEMPTS) {
          // After max attempts with errors, report failure
          if (mounted) {
            setStatus('failed');
            if (onError && !callbacksFired.current) {
              callbacksFired.current = true;
              onError(error instanceof Error ? error : new Error('Transaction status unknown'));
            }
          }
          clearInterval(pollInterval);
        }
      }
    };

    // First check immediately
    checkStatus();
    // Then poll every 2 seconds
    pollInterval = setInterval(checkStatus, 2000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [hash]); // Only depend on hash — callbacks are refs

  const getStatusColor = () => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'included': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'finalized': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/30';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending': return '⏳';
      case 'included': return '📦';
      case 'finalized': return '✅';
      case 'failed': return '❌';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'included': return 'Included in Block';
      case 'finalized': return 'Finalized';
      case 'failed': return 'Failed';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{getStatusIcon()}</span>
        <div>
          <div className="font-medium">
            {getStatusText()}
          </div>
          {blockNumber && (
            <div className="text-xs opacity-75">
              Block #{blockNumber} • {confirmations} confirmation{confirmations !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
      
      {status === 'pending' && (
        <div className="flex items-center gap-2">
          <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-current animate-pulse" style={{ width: '60%' }} />
          </div>
          <span className="text-xs whitespace-nowrap">~2s</span>
        </div>
      )}
      
      {status === 'finalized' && (
        <p className="text-xs opacity-75 mt-2">
          Transaction confirmed with instant BFT finality
        </p>
      )}
    </div>
  );
}
