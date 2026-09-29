'use client';

import { useState } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordResetModal } from './PasswordResetModal';

interface QorIdLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onSwitchToRegister: () => void;
}

export function QorIdLoginModal({ isOpen, onClose, onLoginSuccess, onSwitchToRegister }: QorIdLoginModalProps) {
  const { refreshUser } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [pendingUsername, setPendingUsername] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  if (!isOpen) return null;

  const isEmail = (str: string) => str.includes('@') && str.includes('.');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowSignupPrompt(false);
    setIsLoading(true);

    try {
      // Login accepts email or username
      // Cookie is automatically set by qor-sdk's setToken()
      await qorAuth.login(identifier, password);
      
      // CRITICAL: Refresh the AuthContext state with the logged-in user
      await refreshUser();

      onLoginSuccess();
      onClose();
    } catch (err: any) {
      // Check if username doesn't exist (offer signup)
      const errorMsg = err.message || err.response?.data?.message || '';
      
      if (errorMsg.includes('not found') && errorMsg.includes('sign up') && !isEmail(identifier)) {
        // Username doesn't exist - offer signup
        setPendingUsername(identifier);
        setShowSignupPrompt(true);
        setError(null);
      } else {
        // Provide more helpful error messages
        let errorMessage = 'Login failed. Please check your credentials.';
        
        if (err.message?.includes('not available') || err.message?.includes('Network Error')) {
          errorMessage = 'QOR Auth service is not available. Please ensure the service is running on port 8080.';
        } else if (err.code === 'ERR_NETWORK') {
          errorMessage = 'Cannot connect to QOR Auth service. Please ensure the service is running.';
        } else if (err.message) {
          errorMessage = err.message;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupWithUsername = () => {
    // Switch to register modal with prefilled username
    onSwitchToRegister();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-panel p-8 rounded-lg w-full max-w-md border-2 border-demiurge-cyan/50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-demiurge-cyan">CONNECT WITH QOR ID</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Username or Email</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setShowSignupPrompt(false);
                setError(null);
              }}
              placeholder="Enter your username or email"
              className="w-full bg-gray-800/50 border border-gray-700 rounded p-3 text-white placeholder-gray-500 focus:border-demiurge-cyan focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Chain PIN (Password)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your Chain PIN"
              className="w-full bg-gray-800/50 border border-gray-700 rounded p-3 text-white placeholder-gray-500 focus:border-demiurge-cyan focus:outline-none"
              required
            />
          </div>

          {showSignupPrompt && (
            <div className="bg-blue-900/30 border border-blue-500/50 rounded p-4 text-blue-300 text-sm space-y-3">
              <div className="font-semibold">Username Not Found</div>
              <div>Username <strong>{pendingUsername}</strong> is not registered.</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSignupWithUsername}
                  className="flex-1 bg-gradient-to-r from-demiurge-violet to-demiurge-cyan text-white font-bold py-2 px-4 rounded hover:chroma-glow transition-all"
                >
                  Sign Up with {pendingUsername}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSignupPrompt(false);
                    setPendingUsername('');
                  }}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded p-3 text-red-400 text-sm space-y-2">
              <div className="font-semibold">Login Error</div>
              <div>{error}</div>
              {error.includes('not available') && (
                <div className="text-xs text-gray-400 mt-2">
                  To start the QOR Auth service, run: <code className="bg-gray-800 px-2 py-1 rounded">cd services/qor-auth && cargo run</code>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !identifier || !password}
            className="w-full bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-white font-bold py-3 rounded-lg hover:chroma-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connecting...' : 'LOGIN TO JOIN'}
          </button>

          <div className="text-center pt-4 border-t border-demiurge-cyan/20 space-y-2">
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-demiurge-cyan hover:text-demiurge-violet transition-colors underline block w-full"
            >
              GET QOR ID
            </button>
            <button
              type="button"
              onClick={() => {
                // TODO: Open password reset modal
                // For now, just show a message
                setError('Password reset feature coming soon. Use your backup code if you have a username-only account.');
              }}
              className="text-gray-400 hover:text-gray-300 transition-colors text-sm underline"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>

      <PasswordResetModal
        isOpen={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
        onResetSuccess={() => {
          setShowPasswordReset(false);
          // Optionally auto-login or show success message
        }}
      />
    </div>
  );
}
