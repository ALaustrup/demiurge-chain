'use client';

import { NetworkAnalyticsDashboard } from '@/components/analytics/NetworkAnalyticsDashboard';
import { EraRewardsDisplay } from '@/components/consensus/EraRewardsDisplay';

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <NetworkAnalyticsDashboard />
        <EraRewardsDisplay />
      </div>
    </main>
  );
}
