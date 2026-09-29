'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ChainBadgesCollection } from '@/components/badges';

export default function WalletBadgesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: isLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-cyan animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/wallet')}
          className="mb-6 flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Wallet
        </button>

        {/* Badge Collection */}
        <ChainBadgesCollection showTitle maxColumns={5} />
      </div>
    </div>
  );
}
