'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * DEPRECATED: The standalone wallet page has been moved to the Dashboard.
 * This page now redirects to /portal where the Wallet Widget is available.
 * 
 * TODO: Remove this file after March 2026 - keeping temporarily for SEO/bookmark redirects
 * @deprecated since v1.0.0 - Use /portal instead
 */
export default function WalletPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new dashboard
    router.replace('/portal');
  }, [router]);

  return (
    <main className="min-h-screen p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4" />
        <p className="text-gray-400">Redirecting to Dashboard...</p>
        <p className="text-gray-500 text-sm mt-2">
          The wallet is now part of your Dashboard.
        </p>
      </div>
    </main>
  );
}
