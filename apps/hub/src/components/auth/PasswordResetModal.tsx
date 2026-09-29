'use client';

import { useState } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSuccess: () => void;
}

export function PasswordResetModal({ isOpen, onClose, onResetSuccess }: PasswordResetModalProps) {
  const [step, setStep] = useState<'identifier' | 'backup-code' | 'token' | 'new-password'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requiresBackupCode, setRequiresBackupCode] = useState(false);
  const [pendingUsername, setPendingUsername] = useState('');

  if (!isOpen) return null;

  const isEmail = (str: string) => str.includes('@') && str.includes('.');

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await qorAuth.forgotPassword(identifier);

      if (response.requires_backup_code) {
        // Username-only account: need backup code
        setRequiresBackupCode(true);
        setPendingUsername(identifier);
        setStep('backup-code');
      } else {
        // Email account: token will be sent (or returned in dev)
        if (response.reset_token) {
          // Dev mode: token returned directly
          setResetToken(response.reset_token);
          setStep('token');
        } else {
          // Production: email sent
          setStep('token');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process password reset request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupCode || backupCode.length < 32) {
      setError('Please enter your 32-character backup code');
      return;
    }

    setStep('new-password');
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setError('Please enter the reset token from your email');
      return;
    }

    setStep('new-password');
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
      if (newPassword.length < 6) {
        setError('Chain PIN must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      if (requiresBackupCode) {
        await qorAuth.resetPasswordWithBackup(pendingUsername, backupCode, newPassword);
      } else {
        await qorAuth.resetPasswordWithToken(resetToken, newPassword);
      }

      onResetSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-panel p-8 rounded-lg w-full max-w-md border-2 border-demiurge-cyan/50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-demiurge-cyan">RESET PASSWORD</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {step === 'identifier' ? (
          <form onSubmit={handleIdentifierSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Username or Email</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your username or email"
                className="w-full bg-gray-800/50 border border-gray-700 rounded p-3 text-white placeholder-gray-500 focus:border-demiurge-cyan focus:outline-none"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !identifier}
              className="w-full bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-white font-bold py-3 rounded-lg hover:chroma-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'RESET PASSWORD'}
            </button>
          </form>
        ) : step === 'backup-code' ? (
          <form onSubmit={handleBackupCodeSubmit} className="space-y-4">
            <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-3 mb-4">
              <div className="text-yellow-300 text-sm">
                This account requires a backup code to reset the password.
                Enter the 32-character backup code you received when you created your account.
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Backup Code</label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))}
                placeholder="Enter your 32-character backup code"
                maxLength={32}
                className="w-full bg-gray-800/50 border border-gray-700 rounded p-3 text-white placeholder-gray-500 focus:border-demiurge-cyan focus:outline-none font-mono text-center text-lg tracking-wider"
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {backupCode.length}/32 characters
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || backupCode.length !== 32}
              className="w-full bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-white font-bold py-3 rounded-lg hover:chroma-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'VERIFY BACKUP CODE'}
            </button>
          </form>
        ) : step === 'token' ? (
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div className="bg-blue-900/30 border border-blue-500/50 rounded p-3 mb-4">
              <div className="text-blue-300 text-sm">
                Check your email for a password reset link. Enter the token from the email below.
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Reset Token</label>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Enter reset token from email"
                className="w-full bg-gray-800/50 border border-gray-700 rounded p-3 text-white placeholder-gray-500 focus:border-demiurge-cyan focus:outline-none font-mono"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !resetToken}
              className="w-full bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-white font-bold py-3 rounded-lg hover:chroma-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'VERIFY TOKEN'}
            </button>
          </form>
        ) : step === 'new-password' ? (
          <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">New Chain PIN (Password)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (minimum 6 characters)"
                className="w-full bg-gray-800/50 border border-gray-700 rounded p-3 text-white placeholder-gray-500 focus:border-demiurge-cyan focus:outline-none"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm Chain PIN</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-gray-800/50 border border-gray-700 rounded p-3 text-white placeholder-gray-500 focus:border-demiurge-cyan focus:outline-none"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
              className="w-full bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-white font-bold py-3 rounded-lg hover:chroma-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting...' : 'RESET PASSWORD'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
