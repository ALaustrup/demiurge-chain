// Demiurge Wallet Extension - Unlock Screen
import React, { useState } from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';

export function UnlockScreen() {
  const { unlock, isLoading } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      await unlock(password);
    } catch (e) {
      setError('Invalid password');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-gradient-to-br from-demiurge-400 to-demiurge-600 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-gray-400 text-center mb-8">
          Enter your password to unlock your wallet
        </p>
      </div>

      <form onSubmit={handleUnlock} className="space-y-4">
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="input"
            autoFocus
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <Button fullWidth type="submit" loading={isLoading}>
          Unlock
        </Button>
      </form>
    </div>
  );
}
