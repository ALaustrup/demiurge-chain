'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { qorAuth, type User } from '@demiurge/qor-sdk';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGod: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get user from token without API call
function getUserFromToken(): User | null {
  const tokenData = qorAuth.getTokenData();
  if (!tokenData) return null;
  
  // Check if token is expired
  if (tokenData.exp && Date.now() / 1000 > tokenData.exp) {
    return null; // Token expired
  }
  
  return {
    id: tokenData.user_id,
    qor_id: tokenData.qor_id,
    email: '',
    role: (tokenData.role as User['role']) || 'user',
  };
}

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Don't retry on 401 - that's a definitive auth failure
      if (error.response?.status === 401) throw error;
      // Wait with exponential backoff
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, baseDelayMs * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = qorAuth.getToken();
      const refreshToken = qorAuth.getRefreshToken();
      
      if (!token) {
        // No token - check if we have cached user as fallback
        const cachedUser = localStorage.getItem('demiurge_user');
        if (cachedUser) {
          try {
            const parsed = JSON.parse(cachedUser);
            // Only use cache if we have a valid refresh token
            if (refreshToken) {
              console.log('[Auth] No token but have refresh token, attempting restore...');
              try {
                await qorAuth.refreshToken(refreshToken);
                const profile = await qorAuth.getProfile();
                setUser(profile);
                console.log('[Auth] Session restored via refresh token');
                setLoading(false);
                return;
              } catch {
                // Refresh failed, clear cache
                localStorage.removeItem('demiurge_user');
              }
            }
          } catch {
            localStorage.removeItem('demiurge_user');
          }
        }
        setLoading(false);
        return;
      }
      
      try {
        // First, get user from token data (instant, no API call)
        const tokenUser = getUserFromToken();
        if (tokenUser) {
          // Set user immediately from token for instant UI update
          setUser(tokenUser);
        }
        
        // Check if token is expiring soon and proactively refresh
        if (qorAuth.isTokenExpiringSoon() && refreshToken) {
          console.log('[Auth] Token expiring soon, proactively refreshing...');
          try {
            await qorAuth.refreshToken(refreshToken);
            console.log('[Auth] Token refreshed successfully');
          } catch (refreshError) {
            console.warn('[Auth] Proactive refresh failed:', refreshError);
            // Continue with current token - it might still be valid
          }
        }
        
        // Now fetch full profile (with retry for network issues)
        try {
          const profile = await retryWithBackoff(() => qorAuth.getProfile(), 2);
          setUser(profile);
        } catch (profileError: any) {
          // Profile fetch failed - but we already have tokenUser, so keep it
          if (tokenUser) {
            console.log('[Auth] Profile fetch failed, using token data');
            // Try to enhance with cached data
            const cachedUser = localStorage.getItem('demiurge_user');
            if (cachedUser) {
              try {
                const cached = JSON.parse(cachedUser);
                setUser({ ...tokenUser, ...cached, ...tokenUser }); // Token data takes precedence
              } catch {
                // Keep tokenUser as-is
              }
            }
          }
        }
      } catch (error: any) {
        console.warn('[Auth] Init error:', error.message);
        
        // Token expired or invalid - try refresh
        if (error.response?.status === 401 && refreshToken) {
          try {
            console.log('[Auth] 401 received, attempting token refresh...');
            await retryWithBackoff(() => qorAuth.refreshToken(refreshToken), 2);
            const profile = await qorAuth.getProfile();
            setUser(profile);
            console.log('[Auth] Session restored via refresh token');
          } catch (refreshError) {
            console.warn('[Auth] Token refresh failed after retries');
            qorAuth.clearToken();
            localStorage.removeItem('demiurge_user');
            setUser(null);
          }
        } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
          // Network errors - use token data or cache
          console.warn('[Auth] Network error, using offline data');
          const tokenUser = getUserFromToken();
          if (tokenUser) {
            setUser(tokenUser);
          } else {
            const cachedUser = localStorage.getItem('demiurge_user');
            if (cachedUser) {
              try {
                setUser(JSON.parse(cachedUser));
              } catch {
                // Invalid cache
              }
            }
          }
        } else {
          // Unknown error - clear session to be safe
          console.warn('[Auth] Auth check failed:', error.message);
          qorAuth.clearToken();
          setUser(null);
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  // Cache user data on change
  useEffect(() => {
    if (user) {
      localStorage.setItem('demiurge_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('demiurge_user');
    }
  }, [user]);

  // Refresh token when user returns to tab (after being away)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        // Check if token needs refresh when user returns
        const refreshToken = qorAuth.getRefreshToken();
        if (qorAuth.isTokenExpiringSoon() && refreshToken) {
          console.log('[Auth] User returned, refreshing expiring token...');
          try {
            await qorAuth.refreshToken(refreshToken);
            console.log('[Auth] Token refreshed on visibility change');
          } catch (error) {
            console.warn('[Auth] Visibility refresh failed:', error);
            // Don't log out - let the next API call handle it
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Sync auth state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'qor_token') {
        if (!e.newValue) {
          // Token was cleared in another tab - log out here too
          setUser(null);
        } else if (!user) {
          // Token was set in another tab - try to restore session
          const tokenUser = getUserFromToken();
          if (tokenUser) {
            setUser(tokenUser);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const login = useCallback(async (identifier: string, password: string) => {
    const response = await qorAuth.login(identifier, password);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await qorAuth.logout();
    } catch {
      // Clear local state even if API fails
      qorAuth.clearToken();
    }
    localStorage.removeItem('demiurge_user');
    setUser(null);
    // Use router navigation instead of hard redirect to preserve SPA state
    window.location.href = '/';
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await qorAuth.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails with 401, try token refresh
      const refreshToken = qorAuth.getRefreshToken();
      if ((error as any).response?.status === 401 && refreshToken) {
        try {
          await qorAuth.refreshToken(refreshToken);
          const profile = await qorAuth.getProfile();
          setUser(profile);
        } catch {
          // Refresh failed - session is truly invalid
          qorAuth.clearToken();
          setUser(null);
        }
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isGod: user?.role === 'god',
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for protected pages - shows loading state while checking auth
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { redirectTo?: string; requireGod?: boolean }
) {
  return function ProtectedComponent(props: P) {
    const { user, loading, isGod } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = options?.redirectTo || '/login';
      }
      return null;
    }

    if (options?.requireGod && !isGod) {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      return null;
    }

    return <Component {...props} />;
  };
}
