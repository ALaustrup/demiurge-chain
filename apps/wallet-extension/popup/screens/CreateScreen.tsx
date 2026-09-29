// Demiurge Wallet Extension - Create/Import Screen
import React, { useState } from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';

type Mode = 'choice' | 'create' | 'import' | 'backup';

export function CreateScreen() {
  const { createWallet, importWallet, isLoading } = useStore();
  const [mode, setMode] = useState<Mode>('choice');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [backedUp, setBackedUp] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const mnemonic = await createWallet(password);
      setGeneratedMnemonic(mnemonic);
      setMode('backup');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleImport = async () => {
    setError('');
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      setError('Please enter a valid 12 or 24 word recovery phrase');
      return;
    }

    try {
      await importWallet(password, mnemonic.trim());
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleBackupComplete = () => {
    if (!backedUp) {
      setError('Please confirm you have backed up your recovery phrase');
      return;
    }
    // Wallet already created, just close
    window.close();
  };

  if (mode === 'choice') {
    return (
      <div className="flex-1 flex flex-col p-6">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-demiurge-400 to-demiurge-600 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-3xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Demiurge Wallet</h1>
          <p className="text-gray-400 text-center mb-8">
            Secure wallet for CGT tokens and dApp interactions
          </p>
        </div>

        <div className="space-y-3">
          <Button fullWidth onClick={() => setMode('create')}>
            Create New Wallet
          </Button>
          <Button fullWidth variant="secondary" onClick={() => setMode('import')}>
            Import Existing Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'backup') {
    return (
      <div className="flex-1 flex flex-col p-6">
        <h1 className="text-xl font-bold text-white mb-2">Backup Recovery Phrase</h1>
        <p className="text-gray-400 text-sm mb-6">
          Write down these words in order. You'll need them to recover your wallet.
        </p>

        <div className="card mb-6">
          <div className="grid grid-cols-3 gap-2">
            {generatedMnemonic.split(' ').map((word, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-900/50 rounded px-2 py-1.5">
                <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                <span className="text-white text-sm font-mono">{word}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-yellow-500 font-medium text-sm">Keep this safe!</p>
              <p className="text-yellow-500/80 text-xs mt-1">
                Never share your recovery phrase. Anyone with these words can access your wallet.
              </p>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={backedUp}
            onChange={(e) => setBackedUp(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-demiurge-500 focus:ring-demiurge-500"
          />
          <span className="text-gray-300 text-sm">
            I have safely stored my recovery phrase
          </span>
        </label>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <Button fullWidth onClick={handleBackupComplete} disabled={!backedUp}>
          Continue to Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6">
      <button
        onClick={() => setMode('choice')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h1 className="text-xl font-bold text-white mb-2">
        {mode === 'create' ? 'Create New Wallet' : 'Import Wallet'}
      </h1>
      <p className="text-gray-400 text-sm mb-6">
        {mode === 'create'
          ? 'Set a strong password to protect your wallet'
          : 'Enter your recovery phrase and set a password'}
      </p>

      <div className="space-y-4 flex-1">
        {mode === 'import' && (
          <div>
            <label className="block text-gray-300 text-sm mb-2">Recovery Phrase</label>
            <textarea
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="Enter your 12 or 24 word recovery phrase"
              className="input h-24 resize-none font-mono text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-gray-300 text-sm mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="input"
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className="input"
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-gray-600 bg-gray-800 text-demiurge-500 focus:ring-demiurge-500"
          />
          <span className="text-gray-400 text-sm">
            I understand that Demiurge cannot recover my password or funds if I lose access to my wallet
          </span>
        </label>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <Button
        fullWidth
        loading={isLoading}
        disabled={!agreedToTerms || !password || !confirmPassword}
        onClick={mode === 'create' ? handleCreate : handleImport}
      >
        {mode === 'create' ? 'Create Wallet' : 'Import Wallet'}
      </Button>
    </div>
  );
}
