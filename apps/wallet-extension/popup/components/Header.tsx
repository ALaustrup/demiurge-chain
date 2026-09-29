// Demiurge Wallet Extension - Header Component
import React, { useState } from 'react';
import { useStore } from '../store';

export function Header() {
  const { network, switchNetwork, setView, activeAccount, isAuthenticated, authUser, authLogout, detachWallet } = useStore();
  const [showDetachConfirm, setShowDetachConfirm] = useState(false);

  const networks = [
    { id: 'mainnet', name: 'Mainnet' },
    { id: 'testnet', name: 'Testnet' },
    { id: 'devnet', name: 'Devnet' },
  ];

  const handleDetach = async () => {
    await detachWallet();
    setShowDetachConfirm(false);
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-demiurge-400 to-demiurge-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          {isAuthenticated && authUser ? (
            <span className="font-medium text-white text-sm truncate max-w-[100px]" title={authUser.qorId}>
              {authUser.displayName || authUser.qorId}
            </span>
          ) : (
            <span className="font-semibold text-white">Demiurge</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={network}
            onChange={(e) => switchNetwork(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-demiurge-500"
          >
            {networks.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setView('settings')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Logout button (sign out of QOR ID) */}
          <button
            onClick={authLogout}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            title="Sign Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Detach confirmation modal */}
      {showDetachConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white mb-3">Detach Wallet</h2>
            <p className="text-gray-400 text-sm mb-4">
              This will clear all local wallet data and sign you out. You can always sign back in with your QOR ID.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDetachConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDetach}
                className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors text-sm font-medium"
              >
                Detach
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
