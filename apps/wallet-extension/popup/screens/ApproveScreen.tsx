// Demiurge Wallet Extension - Approve Screen (dApp Requests)
import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import type { PendingRequest } from '../../shared/types';

export function ApproveScreen() {
  const { setView, activeAccount } = useStore();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_PENDING_REQUESTS' });
      if (response.success && response.data) {
        setRequests(response.data);
        if (response.data.length === 0) {
          setView('main');
        }
      }
    } catch (error) {
      console.error('Failed to load pending requests:', error);
    }
  };

  const handleApprove = async () => {
    const request = requests[currentIndex];
    if (!request) return;

    setLoading(true);
    try {
      await chrome.runtime.sendMessage({
        type: 'APPROVE_REQUEST',
        payload: { requestId: request.id },
      });
      
      // Move to next request or back to main
      if (currentIndex < requests.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setView('main');
      }
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const request = requests[currentIndex];
    if (!request) return;

    setLoading(true);
    try {
      await chrome.runtime.sendMessage({
        type: 'REJECT_REQUEST',
        payload: { requestId: request.id },
      });
      
      // Move to next request or back to main
      if (currentIndex < requests.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setView('main');
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentRequest = requests[currentIndex];

  if (!currentRequest) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <p className="text-gray-400">No pending requests</p>
        <Button className="mt-4" onClick={() => setView('main')}>
          Back to Wallet
        </Button>
      </div>
    );
  }

  const renderRequestDetails = () => {
    switch (currentRequest.type) {
      case 'connect':
        return (
          <>
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">
                {currentRequest.origin?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Connection Request</h2>
            <p className="text-gray-400 text-center text-sm mb-6">
              <span className="text-white font-medium">{currentRequest.origin}</span>
              {' '}wants to connect to your wallet
            </p>

            <div className="card w-full mb-6">
              <h3 className="text-gray-400 text-sm mb-3">This site will be able to:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  View your wallet address
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Request transaction approval
                </li>
              </ul>
            </div>
          </>
        );

      case 'transaction':
        const tx = currentRequest.data;
        return (
          <>
            <div className="w-16 h-16 bg-demiurge-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-demiurge-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Approve Transaction</h2>
            <p className="text-gray-400 text-center text-sm mb-6">
              <span className="text-white font-medium">{currentRequest.origin}</span>
              {' '}requests a transaction
            </p>

            <div className="card w-full mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">From</span>
                <span className="text-white font-mono">
                  {activeAccount?.slice(0, 8)}...{activeAccount?.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">To</span>
                <span className="text-white font-mono">
                  {tx?.to?.slice(0, 8)}...{tx?.to?.slice(-6)}
                </span>
              </div>
              <div className="border-t border-gray-700 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white font-bold">
                    {tx?.value ? (Number(tx.value) / 1e18).toFixed(6) : '0'} CGT
                  </span>
                </div>
              </div>
            </div>
          </>
        );

      case 'sign':
        return (
          <>
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sign Message</h2>
            <p className="text-gray-400 text-center text-sm mb-6">
              <span className="text-white font-medium">{currentRequest.origin}</span>
              {' '}requests your signature
            </p>

            <div className="card w-full mb-6">
              <h3 className="text-gray-400 text-sm mb-2">Message</h3>
              <p className="text-white text-sm font-mono bg-gray-900/50 rounded p-3 break-all max-h-32 overflow-y-auto">
                {currentRequest.data?.message || 'No message provided'}
              </p>
            </div>
          </>
        );

      default:
        return (
          <p className="text-gray-400">Unknown request type</p>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Progress indicator */}
      {requests.length > 1 && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-gray-400 text-sm">
            Request {currentIndex + 1} of {requests.length}
          </span>
        </div>
      )}

      {/* Request details */}
      <div className="flex-1 flex flex-col items-center">
        {renderRequestDetails()}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          fullWidth
          onClick={handleReject}
          disabled={loading}
        >
          Reject
        </Button>
        <Button
          fullWidth
          onClick={handleApprove}
          loading={loading}
        >
          Approve
        </Button>
      </div>
    </div>
  );
}
