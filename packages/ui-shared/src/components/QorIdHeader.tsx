'use client';

'use client';

import { useState, useEffect } from 'react';
import { qorAuth, type User } from '@demiurge/qor-sdk';

export function QorIdHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (qorAuth.isAuthenticated()) {
        try {
          const profile = await qorAuth.getProfile();
          setUser(profile);
        } catch (error: any) {
          // Handle network errors gracefully
          if (error.message?.includes('not available') || error.code === 'ERR_NETWORK') {
            console.warn('QOR Auth service not available - running in offline mode');
            // Don't show error to user, just show login button
          } else {
            console.error('Failed to load user profile:', error);
          }
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await qorAuth.logout();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="glass-panel px-4 py-2 rounded-lg">
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="glass-panel px-4 py-2 rounded-lg hover:chroma-glow transition-all"
      >
        Login
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 glass-panel px-4 py-2 rounded-lg hover:chroma-glow transition-all"
      >
        {/* Avatar will be injected by hub app */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-demiurge-cyan to-demiurge-violet flex items-center justify-center text-sm font-bold">
          {user.qor_id.charAt(0).toUpperCase()}
        </div>
        <span className="text-white">{user.qor_id}</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 glass-panel p-4 rounded-lg min-w-[200px] z-50">
          <div className="space-y-2">
            <div className="text-sm text-demiurge-cyan font-bold pb-2 border-b border-demiurge-cyan/20">
              {user.qor_id}
            </div>
            <a
              href="/profile"
              className="block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left"
            >
              Profile
            </a>
            <a
              href="/settings"
              className="block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left"
            >
              Settings
            </a>
            {user.role === 'god' && (
              <a
                href="/admin"
                className="block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left text-demiurge-gold"
              >
                Admin Portal
              </a>
            )}
            <button
              onClick={handleLogout}
              className="block w-full glass-panel py-2 px-3 rounded hover:chroma-glow transition-all text-left text-red-400"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
