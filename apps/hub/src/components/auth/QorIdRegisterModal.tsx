'use client';

import { useState, useEffect, useRef } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';

interface QorIdRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: () => void;
  onBackToLogin: () => void;
}

export function QorIdRegisterModal({ isOpen, onClose, onRegisterSuccess, onBackToLogin }: QorIdRegisterModalProps) {
  const [step, setStep] = useState<'username' | 'email' | 'password' | 'backup-code' | 'email-verification'>('username');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [backupCode, setBackupCode] = useState<string | null>(null);
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | 'invalid' | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<'valid' | 'invalid' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailAdded, setEmailAdded] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStep('username');
      setUsername('');
      setEmail('');
      setPassword('');
      setBackupCode(null);
      setEmailVerificationToken(null);
      setUsernameStatus(null);
      setPasswordStatus(null);
      setError(null);
      setEmailAdded(false);
    }
  }, [isOpen]);

  // Real-time username validation
  useEffect(() => {
    if (step !== 'username' || !username) {
      setUsernameStatus(null);
      return;
    }

    // Clear previous timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    // Validate format first
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    // Debounce API call
    setUsernameStatus('checking');
    checkTimeoutRef.current = setTimeout(async () => {
      try {
        // Call API to check username availability
        const result = await qorAuth.checkUsername(username);
        if (result.available) {
          setUsernameStatus('available');
        } else {
          setUsernameStatus('taken');
        }
      } catch (err) {
        // If API fails, assume available (for offline mode)
        setUsernameStatus('available');
      }
    }, 500);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [username, step]);

  // Password validation (Safe Word - minimum 6 characters)
  useEffect(() => {
    if (step !== 'password' || !password) {
      setPasswordStatus(null);
      return;
    }

    // Minimum 6 characters for safe word
    if (password.length >= 6) {
      setPasswordStatus('valid');
    } else {
      setPasswordStatus('invalid');
    }
  }, [password, step]);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus === 'available') {
      setStep('email');
      setError(null);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('password');
    setError(null);
  };

  const handleSkipEmail = () => {
    setEmail('');
    setEmailAdded(false);
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordStatus !== 'valid') return;

    setError(null);
    setIsLoading(true);

    try {
      // Register with QOR Auth
      // Email is optional - if not provided, account is username-only
      const registerEmail = email.trim() || undefined;
      
      const response = await qorAuth.register({
        email: registerEmail,
        password,
        username,
      });

      // Handle response based on whether email was provided
      if (response.backup_code) {
        // Username-only account: show backup code
        setBackupCode(response.backup_code);
        setStep('backup-code');
      } else if (response.email_verification_token) {
        // Email account: show verification message
        setEmailVerificationToken(response.email_verification_token);
        setStep('email-verification');
      } else {
        // Should not happen, but handle gracefully
        onRegisterSuccess();
        onClose();
      }
    } catch (err: any) {
      // Provide more helpful error messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.message?.includes('not available')) {
        errorMessage = 'QOR Auth service is not running. Please start the service on port 8080.';
      } else if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to QOR Auth service. Please ensure the service is running.';
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-panel p-8 rounded-lg w-full max-w-md border-2 border-demiurge-violet/50">
        {step === 'username' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-demiurge-violet">CHOOSE YOUR ON-CHAIN USERNAME</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="3-20 characters, alphanumeric and _"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded p-3 text-white placeholder-gray-500 focus:border-demiurge-violet focus:outline-none"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]{3,20}"
                />
                {usernameStatus === 'checking' && (
                  <div className="text-xs text-gray-500 mt-1">Checking availability...</div>
                )}
                {usernameStatus === 'available' && (
                  <div className="text-xs text-green-400 mt-1">✓ Username available</div>
                )}
                {usernameStatus === 'taken' && (
                  <div className="text-xs text-red-400 mt-1">✗ Username already taken</div>
                )}
                {usernameStatus === 'invalid' && username.length > 0 && (
                  <div className="text-xs text-red-400 mt-1">Invalid format (3-20 alphanumeric characters)</div>
                )}
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-500/50 rounded p-3 text-red-400 text-sm space-y-2">
                  <div className="font-semibold">Registration Error</div>
                  <div>{error}</div>
                  {error.includes('not running') && (
                    <div className="text-xs text-gray-400 mt-2">
                      To start the QOR Auth service, run: <code className="bg-gray-800 px-2 py-1 rounded">cd services/qor-auth && cargo run</code>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={usernameStatus !== 'available'}
                className={`w-full font-bold py-3 rounded-lg transition-all ${
                  usernameStatus === 'available'
                    ? 'bg-gradient-to-r from-demiurge-violet to-demiurge-cyan text-white chroma-glow'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {usernameStatus === 'available' ? 'CONTINUE' : 'CHECKING...'}
              </button>

              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full text-demiurge-cyan hover:text-demiurge-violet transition-colors text-sm underline"
              >
                Back to Login
              </button>
            </form>
          </>
        ) : step === 'email' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-demiurge-cyan">ADD EMAIL (OPTIONAL)</h2>
              <button
                onClick={() => setStep('username')}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Back
              </button>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border-2 border-yellow-500/50 rounded p-4">
                <div className="text-yellow-300 font-semibold mb-2">🎁 BONUS OFFER</div>
                <div className="text-yellow-200 text-sm">
                  Add your email address and receive <strong className="text-yellow-300">5 CGT</strong> as a welcome bonus!
                  <br />
                  <span className="text-xs text-yellow-300/80 mt-1 block">Helps us build our community and keep you updated.</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Email Address <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailAdded(e.target.value.trim().length > 0);
                  }}
                  placeholder="your@email.com"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded p-3 text-white placeholder-gray-500 focus:border-demiurge-cyan focus:outline-none"
                />
                {email && (
                  <div className="text-xs text-green-400 mt-1">✓ Email added - You'll receive 5 CGT bonus!</div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-white font-bold py-3 rounded-lg hover:chroma-glow transition-all"
                >
                  CONTINUE
                </button>
                <button
                  type="button"
                  onClick={handleSkipEmail}
                  className="px-4 py-3 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                >
                  Skip
                </button>
              </div>
            </form>
          </>
        ) : step === 'password' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-demiurge-gold">CHOOSE A SAFE WORD</h2>
              <button
                onClick={() => setStep('email')}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Back
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Safe Word (Password)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a safe word (minimum 6 characters)"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded p-3 text-white placeholder-gray-500 focus:border-demiurge-gold focus:outline-none"
                  required
                  minLength={6}
                />
                {passwordStatus === 'valid' && (
                  <div className="text-xs text-green-400 mt-1">✓ Safe word accepted</div>
                )}
                {passwordStatus === 'invalid' && password.length > 0 && (
                  <div className="text-xs text-red-400 mt-1">Safe word must be at least 6 characters</div>
                )}
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-500/50 rounded p-3 text-red-400 text-sm space-y-2">
                  <div className="font-semibold">Registration Error</div>
                  <div>{error}</div>
                  {(error.includes('not running') || error.includes('not available')) && (
                    <div className="text-xs text-gray-400 mt-2">
                      To start the QOR Auth service, run: <code className="bg-gray-800 px-2 py-1 rounded">cd services/qor-auth && cargo run</code>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={passwordStatus !== 'valid' || isLoading}
                className={`w-full font-bold py-3 rounded-lg transition-all ${
                  passwordStatus === 'valid'
                    ? 'bg-gradient-to-r from-demiurge-gold to-demiurge-violet text-white chroma-glow'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Creating Account...' : 'GET IT NOW'}
              </button>
            </form>
          </>
        ) : step === 'backup-code' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-demiurge-gold">SAVE YOUR BACKUP CODE</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded p-4">
                <div className="text-yellow-300 font-semibold mb-2">⚠️ IMPORTANT</div>
                <div className="text-yellow-200 text-sm mb-4">
                  You did not provide an email address. This backup code is your only way to reset your password if you forget it.
                  <strong className="block mt-2">Save this code in a safe place!</strong>
                </div>
                <div className="bg-black/50 p-4 rounded border border-yellow-500/30">
                  <div className="text-xs text-gray-400 mb-1">BACKUP CODE</div>
                  <div className="text-2xl font-mono font-bold text-yellow-300 tracking-wider text-center py-2">
                    {backupCode}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(backupCode || '');
                  }}
                  className="w-full mt-3 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 py-2 rounded transition-colors text-sm"
                >
                  Copy to Clipboard
                </button>
              </div>

              <button
                onClick={() => {
                  onRegisterSuccess();
                  onClose();
                }}
                className="w-full bg-gradient-to-r from-demiurge-gold to-demiurge-violet text-white font-bold py-3 rounded-lg hover:chroma-glow transition-all"
              >
                I'VE SAVED MY CODE
              </button>
            </div>
          </>
        ) : step === 'email-verification' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-demiurge-cyan">CHECK YOUR EMAIL</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-900/30 border-2 border-blue-500/50 rounded p-4">
                <div className="text-blue-300 font-semibold mb-2">📧 Email Verification Required</div>
                <div className="text-blue-200 text-sm mb-4">
                  We've sent a verification email to <strong>{email}</strong>.
                  Please check your inbox and click the verification link to activate your account.
                </div>
                {emailVerificationToken && (
                  <div className="bg-black/50 p-3 rounded border border-blue-500/30 mt-3">
                    <div className="text-xs text-gray-400 mb-1">DEV MODE: Verification Token</div>
                    <div className="text-xs font-mono text-blue-300 break-all">
                      {emailVerificationToken}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      In production, this token would be sent via email only.
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onRegisterSuccess();
                  onClose();
                }}
                className="w-full bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-white font-bold py-3 rounded-lg hover:chroma-glow transition-all"
              >
                GOT IT
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
