'use client';

import { useState, useEffect, useRef } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { useAuth } from '@/contexts/AuthContext';

interface QorIdAuthFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  variant?: 'modal' | 'page'; // 'modal' = full-screen overlay, 'page' = simple page layout
  initialStep?: AuthStep; // Initial step to show (for signup links)
}

type AuthStep = 'login' | 'register-username' | 'register-email' | 'register-pin' | 'backup-code' | 'email-verification';

export function QorIdAuthFlow({ isOpen, onClose, onSuccess, variant = 'modal', initialStep }: QorIdAuthFlowProps) {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<AuthStep>(initialStep || 'login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | 'invalid' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backupCode, setBackupCode] = useState<string | null>(null);
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('login');
      setEmail('');
      setUsername('');
      setPassword('');
      setUsernameStatus(null);
      setError(null);
      setBackupCode(null);
      setEmailVerificationToken(null);
    }
  }, [isOpen]);

  // Real-time username validation
  useEffect(() => {
    if (step !== 'register-username' || !username) {
      setUsernameStatus(null);
      return;
    }

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await qorAuth.checkUsername(username);
        setUsernameStatus(result.available ? 'available' : 'taken');
      } catch (err) {
        setUsernameStatus('available'); // Assume available if API fails
      }
    }, 500);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [username, step]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    const currentUsername = username;
    const currentPassword = password;
    
    setError(null);
    setIsLoading(true);

    try {
      const response = await qorAuth.login(currentUsername, currentPassword);
      // Cookie is now set automatically by qor-sdk's setToken()
      
      try {
        await refreshUser();
      } catch {
        // Continue even if refresh fails - token is already set
      }
      
      onSuccess();
      if (variant === 'modal') {
        onClose();
      }
    } catch (err: any) {
      setUsername(currentUsername);
      setPassword(currentPassword);
      
      let errorMessage = 'Login failed. Please check your credentials.';
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to auth service. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(false);
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus === 'available') {
      setStep('register-email');
      setError(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If email provided, check if it's already registered
    if (email.trim()) {
      setIsLoading(true);
      setError(null);
      try {
        const result = await qorAuth.checkEmail(email.trim());
        
        if (!result.available) {
          if (result.reason === 'invalid_format') {
            setError('Please enter a valid email address');
          } else {
            setError('This email is already registered. Please use a different email or login instead.');
          }
          setIsLoading(false);
          return;
        }
      } catch (err) {
        // If check fails, proceed anyway - the register endpoint will catch it
        console.warn('Email check failed, proceeding:', err);
      }
      setIsLoading(false);
    }
    
    // Email is optional - can skip to password
    setStep('register-pin');
    setError(null);
  };

  const handleSkipEmail = () => {
    setEmail('');
    setStep('register-pin');
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await qorAuth.register({
        email: email.trim() || undefined,
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
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCodeAcknowledged = () => {
    onSuccess();
    onClose();
  };

  const handleEmailVerificationAcknowledged = () => {
    // User needs to verify email before they can login
    // Redirect to login page
    setStep('login');
    setError('Please check your email and verify your account before logging in.');
  };

  if (!isOpen) return null;

  // Page variant: Industrial Command Center layout
  if (variant === 'page') {
    return (
      <div className="p-6 md:p-8">
        {/* Login Step */}
        {step === 'login' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 
                className="text-xl md:text-2xl mb-2"
                style={{ 
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 600,
                  letterSpacing: '2px',
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                }}
              >
                AUTHENTICATE
              </h2>
              <p 
                className="text-sm"
                style={{ 
                  fontFamily: "'Barlow', sans-serif",
                  color: '#7B8794',
                }}
              >
                Enter your QOR ID credentials
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div>
                <label 
                  className="block text-xs mb-2 uppercase"
                  style={{ 
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '1px',
                    color: '#7B8794',
                  }}
                >
                  USERNAME OR EMAIL
                </label>
                <input
                  type="text"
                  name="qor-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your QOR ID"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: '15px',
                    color: '#FFFFFF',
                    backgroundColor: '#151A21',
                    border: '1px solid #333333',
                    borderRadius: '0',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FF6A00';
                    e.target.style.boxShadow = '0 0 0 1px #FF6A00';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#333333';
                    e.target.style.boxShadow = 'none';
                  }}
                  autoComplete="username"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                />
              </div>

              <div>
                <label 
                  className="block text-xs mb-2 uppercase"
                  style={{ 
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '1px',
                    color: '#7B8794',
                  }}
                >
                  CHAIN PIN
                </label>
                <input
                  type="password"
                  name="qor-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Chain PIN"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: '15px',
                    color: '#FFFFFF',
                    backgroundColor: '#151A21',
                    border: '1px solid #333333',
                    borderRadius: '0',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FF6A00';
                    e.target.style.boxShadow = '0 0 0 1px #FF6A00';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#333333';
                    e.target.style.boxShadow = 'none';
                  }}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div 
                  className="p-3"
                  style={{
                    backgroundColor: 'rgba(207, 102, 121, 0.1)',
                    border: '1px solid rgba(207, 102, 121, 0.5)',
                    borderRadius: '0',
                    color: '#CF6679',
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: '14px',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !username || !password}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '14px',
                  fontWeight: 600,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: isLoading || !username || !password ? '#4A5568' : '#0B0C10',
                  backgroundColor: isLoading || !username || !password ? '#252D3A' : '#FF6A00',
                  border: '1px solid',
                  borderColor: isLoading || !username || !password ? '#333333' : '#FF6A00',
                  borderRadius: '0',
                  cursor: isLoading || !username || !password ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && username && password) {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#FFFFFF';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 106, 0, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && username && password) {
                    e.currentTarget.style.backgroundColor = '#FF6A00';
                    e.currentTarget.style.borderColor = '#FF6A00';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {isLoading ? 'CONNECTING...' : 'LOGIN'}
              </button>
            </form>

            <div 
              className="mt-6 pt-4 text-center"
              style={{ borderTop: '1px solid #333333' }}
            >
              <button
                type="button"
                onClick={() => setStep('register-username')}
                style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: '14px',
                  color: '#FF6A00',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FF6A00'}
              >
                Don't have an account? <span style={{ fontWeight: 600 }}>CREATE QOR ID</span>
              </button>
            </div>
          </div>
        )}

        {/* Registration steps */}
        {step === 'register-username' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '2px', color: '#FFFFFF', textTransform: 'uppercase' }}>
                CREATE QOR ID
              </h2>
              <p style={{ fontFamily: "'Barlow', sans-serif", color: '#7B8794', fontSize: '14px' }}>
                Step 1 of 3: Choose your on-chain username
              </p>
            </div>

            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label style={{ display: 'block', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '1px', color: '#7B8794', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>
                  USERNAME
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="3-20 characters, alphanumeric and _"
                  style={{ width: '100%', padding: '14px 16px', fontFamily: "'Barlow', sans-serif", fontSize: '15px', color: '#FFFFFF', backgroundColor: '#151A21', border: '1px solid #333333', borderRadius: '0' }}
                  required
                  minLength={3}
                  maxLength={20}
                />
                {usernameStatus === 'checking' && (
                  <div style={{ fontSize: '12px', color: '#FF6A00', marginTop: '8px' }}>Checking availability...</div>
                )}
                {usernameStatus === 'available' && (
                  <div style={{ fontSize: '12px', color: '#22C55E', marginTop: '8px' }}>✓ Username available</div>
                )}
                {usernameStatus === 'taken' && (
                  <div style={{ fontSize: '12px', color: '#CF6679', marginTop: '8px' }}>✗ Username already taken</div>
                )}
                {usernameStatus === 'invalid' && username.length > 0 && (
                  <div style={{ fontSize: '12px', color: '#CF6679', marginTop: '8px' }}>Invalid format (3-20 alphanumeric characters)</div>
                )}
              </div>
              {error && (
                <div style={{ padding: '12px', backgroundColor: 'rgba(207, 102, 121, 0.1)', border: '1px solid rgba(207, 102, 121, 0.5)', color: '#CF6679', fontSize: '14px' }}>{error}</div>
              )}
              <button
                type="submit"
                disabled={usernameStatus !== 'available'}
                style={{ width: '100%', padding: '14px 24px', fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: usernameStatus === 'available' ? '#0B0C10' : '#4A5568', backgroundColor: usernameStatus === 'available' ? '#FF6A00' : '#252D3A', border: '1px solid', borderColor: usernameStatus === 'available' ? '#FF6A00' : '#333333', cursor: usernameStatus === 'available' ? 'pointer' : 'not-allowed' }}
              >
                CONTINUE
              </button>
              <button type="button" onClick={() => setStep('login')} style={{ width: '100%', background: 'none', border: 'none', color: '#FF6A00', fontSize: '14px', cursor: 'pointer', fontFamily: "'Barlow', sans-serif" }}>
                ← Back to Login
              </button>
            </form>
          </div>
        )}

        {step === 'register-email' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '2px', color: '#FFFFFF', textTransform: 'uppercase' }}>
                ADD EMAIL
              </h2>
              <p style={{ fontFamily: "'Barlow', sans-serif", color: '#7B8794', fontSize: '14px' }}>
                Step 2 of 3: Optional but recommended
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div style={{ padding: '16px', backgroundColor: 'rgba(230, 168, 23, 0.1)', border: '1px solid rgba(230, 168, 23, 0.3)' }}>
                <div style={{ color: '#E6A817', fontWeight: 600, marginBottom: '8px', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '1px' }}>BONUS OFFER</div>
                <div style={{ color: '#C5C6C7', fontSize: '14px', fontFamily: "'Barlow', sans-serif" }}>
                  Add your email and receive <strong style={{ color: '#E6A817' }}>5 CGT</strong> welcome bonus!
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '1px', color: '#7B8794', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>
                  EMAIL ADDRESS <span style={{ color: '#4A5568' }}>(OPTIONAL)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{ width: '100%', padding: '14px 16px', fontFamily: "'Barlow', sans-serif", fontSize: '15px', color: '#FFFFFF', backgroundColor: '#151A21', border: '1px solid #333333', borderRadius: '0' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ flex: 1, padding: '14px 24px', fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '2px', color: '#0B0C10', backgroundColor: '#FF6A00', border: '1px solid #FF6A00', cursor: 'pointer' }}>
                  CONTINUE
                </button>
                <button type="button" onClick={handleSkipEmail} style={{ padding: '14px 20px', fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '1px', color: '#7B8794', backgroundColor: 'transparent', border: '1px solid #333333', cursor: 'pointer' }}>
                  SKIP
                </button>
              </div>
              <button type="button" onClick={() => setStep('register-username')} style={{ width: '100%', background: 'none', border: 'none', color: '#FF6A00', fontSize: '14px', cursor: 'pointer', fontFamily: "'Barlow', sans-serif" }}>
                ← Back
              </button>
            </form>
          </div>
        )}

        {step === 'register-pin' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '2px', color: '#FFFFFF', textTransform: 'uppercase' }}>
                SET CHAIN PIN
              </h2>
              <p style={{ fontFamily: "'Barlow', sans-serif", color: '#7B8794', fontSize: '14px' }}>
                Step 3 of 3: Secure your account
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label style={{ display: 'block', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '1px', color: '#7B8794', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase' }}>
                  CHAIN PIN (PASSWORD)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  style={{ width: '100%', padding: '14px 16px', fontFamily: "'Barlow', sans-serif", fontSize: '15px', color: '#FFFFFF', backgroundColor: '#151A21', border: '1px solid #333333', borderRadius: '0' }}
                  required
                  minLength={6}
                />
                {password.length > 0 && (
                  <div style={{ fontSize: '12px', color: password.length >= 6 ? '#22C55E' : '#CF6679', marginTop: '8px' }}>
                    {password.length >= 6 ? '✓ Chain PIN accepted' : `Minimum 6 characters (${password.length}/6)`}
                  </div>
                )}
              </div>
              {error && (
                <div style={{ padding: '12px', backgroundColor: 'rgba(207, 102, 121, 0.1)', border: '1px solid rgba(207, 102, 121, 0.5)', color: '#CF6679', fontSize: '14px' }}>{error}</div>
              )}
              <button
                type="submit"
                disabled={password.length < 6 || isLoading}
                style={{ width: '100%', padding: '14px 24px', fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: password.length >= 6 && !isLoading ? '#0B0C10' : '#4A5568', backgroundColor: password.length >= 6 && !isLoading ? '#FF6A00' : '#252D3A', border: '1px solid', borderColor: password.length >= 6 && !isLoading ? '#FF6A00' : '#333333', cursor: password.length >= 6 && !isLoading ? 'pointer' : 'not-allowed' }}
              >
                {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>
              <button type="button" onClick={() => setStep('register-email')} style={{ width: '100%', background: 'none', border: 'none', color: '#FF6A00', fontSize: '14px', cursor: 'pointer', fontFamily: "'Barlow', sans-serif" }}>
                ← Back
              </button>
            </form>
          </div>
        )}

        {step === 'backup-code' && backupCode && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '2px', color: '#FFFFFF', textTransform: 'uppercase' }}>
                SAVE BACKUP CODE
              </h2>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'rgba(230, 168, 23, 0.1)', border: '1px solid rgba(230, 168, 23, 0.3)' }}>
              <div style={{ color: '#E6A817', fontWeight: 600, marginBottom: '8px', fontFamily: "'Rajdhani', sans-serif" }}>⚠️ IMPORTANT</div>
              <div style={{ color: '#C5C6C7', fontSize: '14px', fontFamily: "'Barlow', sans-serif", marginBottom: '16px' }}>
                This backup code is your only way to recover your account. Save it securely!
              </div>
              <div style={{ padding: '16px', backgroundColor: '#0B0C10', border: '1px solid rgba(230, 168, 23, 0.3)' }}>
                <div style={{ fontSize: '11px', color: '#7B8794', marginBottom: '4px', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '1px' }}>BACKUP CODE</div>
                <div style={{ fontSize: '24px', fontFamily: "'JetBrains Mono', monospace", color: '#E6A817', textAlign: 'center', letterSpacing: '2px' }}>
                  {backupCode}
                </div>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(backupCode)}
                style={{ width: '100%', marginTop: '12px', padding: '10px', fontFamily: "'Rajdhani', sans-serif", fontSize: '12px', letterSpacing: '1px', color: '#E6A817', backgroundColor: 'rgba(230, 168, 23, 0.1)', border: '1px solid rgba(230, 168, 23, 0.3)', cursor: 'pointer' }}
              >
                COPY TO CLIPBOARD
              </button>
            </div>
            <button
              onClick={handleBackupCodeAcknowledged}
              style={{ width: '100%', padding: '14px 24px', fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '2px', color: '#0B0C10', backgroundColor: '#FF6A00', border: '1px solid #FF6A00', cursor: 'pointer' }}
            >
              I'VE SAVED MY CODE
            </button>
          </div>
        )}

        {step === 'email-verification' && email && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '2px', color: '#FFFFFF', textTransform: 'uppercase' }}>
                VERIFY EMAIL
              </h2>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'rgba(139, 0, 0, 0.1)', border: '1px solid rgba(139, 0, 0, 0.3)' }}>
              <div style={{ color: '#CC5500', fontWeight: 600, marginBottom: '8px', fontFamily: "'Rajdhani', sans-serif" }}>📧 EMAIL VERIFICATION</div>
              <div style={{ color: '#C5C6C7', fontSize: '14px', fontFamily: "'Barlow', sans-serif" }}>
                We've sent a verification link to <strong style={{ color: '#FF6A00' }}>{email}</strong>. Check your inbox.
              </div>
            </div>
            <button
              onClick={handleEmailVerificationAcknowledged}
              style={{ width: '100%', padding: '14px 24px', fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '2px', color: '#0B0C10', backgroundColor: '#FF6A00', border: '1px solid #FF6A00', cursor: 'pointer' }}
            >
              I'LL VERIFY MY EMAIL
            </button>
            <button type="button" onClick={() => setStep('login')} style={{ width: '100%', background: 'none', border: 'none', color: '#FF6A00', fontSize: '14px', cursor: 'pointer', fontFamily: "'Barlow', sans-serif" }}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    );
  }

  // Modal variant: full-screen overlay (default)
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
      <div className="glass-panel liquid-border p-10 rounded-xl w-full max-w-lg border-2 border-demiurge-violet/50 relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-2xl z-10"
        >
          ✕
        </button>

        {/* Login Step */}
        {step === 'login' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-grunge text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green mb-2">
                CONNECT WITH QOR ID
              </h2>
              <p className="text-gray-400 font-body">Enter the Demiurge ecosystem</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-body">Username or Email</label>
                <input
                  type="text"
                  name="qor-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your QOR ID or email"
                  className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all"
                  autoComplete="username"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2 font-body">Chain PIN</label>
                <input
                  type="password"
                  name="qor-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Chain PIN"
                  className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green text-white font-grunge-alt py-4 rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg chroma-glow"
              >
                {isLoading ? 'CONNECTING...' : 'LOGIN'}
              </button>

              <div className="text-center pt-4 border-t border-gray-700">
                <a
                  href="/login?step=register"
                  className="text-neon-cyan hover:text-neon-magenta transition-colors underline font-body"
                >
                  Don't have a QOR ID? Get one here
                </a>
              </div>
            </form>
          </div>
        )}

        {/* Register Username Step (Step 1) */}
        {step === 'register-username' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-grunge text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green mb-2">
                CHOOSE YOUR ON-CHAIN USERNAME
              </h2>
              <p className="text-gray-400 font-body">Step 1 of 3: Your on-chain identity</p>
            </div>

            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-body">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="3-20 characters, alphanumeric and _"
                  className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]{3,20}"
                />
                {usernameStatus === 'checking' && (
                  <div className="text-xs text-neon-cyan mt-2 font-body animate-pulse">Checking availability...</div>
                )}
                {usernameStatus === 'available' && (
                  <div className="text-xs text-neon-green mt-2 font-body">✓ Username available</div>
                )}
                {usernameStatus === 'taken' && (
                  <div className="text-xs text-red-400 mt-2 font-body">✗ Username already taken</div>
                )}
                {usernameStatus === 'invalid' && username.length > 0 && (
                  <div className="text-xs text-red-400 mt-2 font-body">Invalid format (3-20 alphanumeric characters)</div>
                )}
              </div>

              {error && (
                <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={usernameStatus !== 'available'}
                className={`w-full font-grunge-alt py-4 rounded-lg transition-all text-lg ${
                  usernameStatus === 'available'
                    ? 'bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green text-white hover:scale-105 chroma-glow'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                CONTINUE
              </button>

              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full text-neon-cyan hover:text-neon-magenta transition-colors text-sm underline font-body"
              >
                Back to Login
              </button>
            </form>
          </div>
        )}

        {/* Register Email Step (Step 2 - Optional) */}
        {step === 'register-email' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-grunge text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green mb-2">
                ADD EMAIL (OPTIONAL)
              </h2>
              <p className="text-gray-400 font-body">Step 2 of 3: Get 5 CGT bonus</p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border-2 border-yellow-500/50 rounded-lg p-4">
                <div className="text-yellow-300 font-semibold mb-2">🎁 BONUS OFFER</div>
                <div className="text-yellow-200 text-sm font-body">
                  Add your email address and receive <strong className="text-yellow-300">5 CGT</strong> as a welcome bonus!
                  <br />
                  <span className="text-xs text-yellow-300/80 mt-1 block">Helps us build our community and keep you updated.</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2 font-body">
                  Email Address <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all"
                />
                {email && (
                  <div className="text-xs text-neon-green mt-2 font-body">✓ Email added - You'll receive 5 CGT bonus!</div>
                )}
              </div>

              {error && (
                <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green text-white font-grunge-alt py-4 rounded-lg hover:scale-105 transition-all text-lg chroma-glow"
                >
                  CONTINUE
                </button>
                <button
                  type="button"
                  onClick={handleSkipEmail}
                  className="px-4 py-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-body"
                >
                  Skip
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep('register-username')}
                className="w-full text-neon-cyan hover:text-neon-magenta transition-colors text-sm underline font-body"
              >
                ← Back
              </button>
            </form>
          </div>
        )}

        {/* Register PIN Step */}
        {step === 'register-pin' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-grunge text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green mb-2">
                SET CHAIN PIN
              </h2>
              <p className="text-gray-400 font-body">Step 3 of 3: Secure your account</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-body">Chain PIN (Password)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all"
                  required
                  minLength={6}
                />
                {password.length > 0 && (
                  <div className={`text-xs mt-2 font-body ${password.length >= 6 ? 'text-neon-green' : 'text-red-400'}`}>
                    {password.length >= 6 ? '✓ Chain PIN accepted' : `Minimum 6 characters (${password.length}/6)`}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2 font-body">Your Chain PIN secures access to blockchain services</p>
              </div>

              {error && (
                <div className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={password.length < 6 || isLoading}
                className={`w-full font-grunge-alt py-4 rounded-lg transition-all text-lg ${
                  password.length >= 6
                    ? 'bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green text-white hover:scale-105 chroma-glow'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'CREATING ACCOUNT...' : 'GET IT NOW'}
              </button>

              <button
                type="button"
                onClick={() => setStep('register-email')}
                className="w-full text-neon-cyan hover:text-neon-magenta transition-colors text-sm underline font-body"
              >
                ← Back
              </button>
            </form>
          </div>
        )}

        {/* Backup Code Step (Username-only accounts) */}
        {step === 'backup-code' && backupCode && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-grunge text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green mb-2">
                SAVE YOUR BACKUP CODE
              </h2>
              <p className="text-gray-400 font-body">Important: Store this code securely</p>
            </div>

            <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg p-6">
              <div className="text-yellow-300 font-semibold mb-3 font-body">⚠️ IMPORTANT</div>
              <div className="text-yellow-200 text-sm mb-4 font-body">
                You did not provide an email address. This backup code is your only way to reset your Chain PIN if you forget it.
                <strong className="block mt-2 text-yellow-300">Save this code in a safe place!</strong>
              </div>
              <div className="bg-black/50 p-4 rounded border border-yellow-500/30">
                <div className="text-xs text-gray-400 mb-1 font-body">BACKUP CODE</div>
                <div className="text-2xl font-mono font-bold text-yellow-300 tracking-wider text-center py-2">
                  {backupCode}
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(backupCode);
                }}
                className="w-full mt-3 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 py-2 rounded transition-colors text-sm font-body"
              >
                Copy to Clipboard
              </button>
            </div>

            <button
              onClick={handleBackupCodeAcknowledged}
              className="w-full bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green text-white font-grunge-alt py-4 rounded-lg hover:scale-105 transition-all text-lg chroma-glow"
            >
              I'VE SAVED MY CODE
            </button>
          </div>
        )}

        {/* Email Verification Step */}
        {step === 'email-verification' && email && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-grunge text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green mb-2">
                CHECK YOUR EMAIL
              </h2>
              <p className="text-gray-400 font-body">Verify your account to continue</p>
            </div>

            <div className="bg-blue-900/30 border-2 border-blue-500/50 rounded-lg p-6">
              <div className="text-blue-300 font-semibold mb-3 font-body">📧 Email Verification Required</div>
              <div className="text-blue-200 text-sm mb-4 font-body">
                We've sent a verification email to <strong className="text-blue-300">{email}</strong>.
                Please check your inbox and click the verification link to activate your account.
              </div>
              {emailVerificationToken && (
                <div className="bg-black/50 p-3 rounded border border-blue-500/30 mt-3">
                  <div className="text-xs text-gray-400 mb-1 font-body">VERIFICATION TOKEN</div>
                  <div className="text-sm font-mono text-blue-300 break-all font-body">
                    {emailVerificationToken}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleEmailVerificationAcknowledged}
              className="w-full bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green text-white font-grunge-alt py-4 rounded-lg hover:scale-105 transition-all text-lg chroma-glow"
            >
              GOT IT - I'LL VERIFY MY EMAIL
            </button>

            <button
              type="button"
              onClick={() => setStep('login')}
              className="w-full text-neon-cyan hover:text-neon-magenta transition-colors text-sm underline font-body"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
