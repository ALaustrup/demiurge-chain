'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { qorAuth } from '@demiurge/qor-sdk';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription?: string;
}

export function ComingSoonModal({ isOpen, onClose, featureName, featureDescription }: ComingSoonModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reward, setReward] = useState<{ cgt: number; hint?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email && !phone) {
      setError('Please provide at least an email or phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notify-me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${qorAuth.getToken()}`,
        },
        body: JSON.stringify({
          email: email || undefined,
          phone: phone || undefined,
          feature: featureName,
          qorId: user?.qor_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      setSuccess(true);
      setReward(data.reward);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-neon-cyan/30 animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!success ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 mb-4">
                <span className="text-3xl">🚀</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Coming Soon!</h2>
              <p className="text-neon-cyan font-semibold">{featureName}</p>
              {featureDescription && (
                <p className="text-gray-400 text-sm mt-2">{featureDescription}</p>
              )}
            </div>

            {/* Reward Banner */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-yellow-400 font-bold">Get Notified & Earn!</p>
                  <p className="text-xs text-gray-400">
                    Receive <span className="text-yellow-400 font-bold">100 CGT</span> when you provide both email & phone
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Email Address <span className="text-yellow-400">(+50 CGT)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-neon-cyan outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Phone Number <span className="text-yellow-400">(+50 CGT)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-neon-cyan outline-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!email && !phone)}
                className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
                    Registering...
                  </>
                ) : (
                  <>
                    <span>🔔</span>
                    Notify Me & Earn CGT
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                We'll only contact you about this feature. No spam, ever.
              </p>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neon-green/10 border border-neon-green/30 mb-4">
              <span className="text-4xl">✨</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You're On The List!</h2>
            <p className="text-gray-400 mb-6">
              We'll notify you as soon as <span className="text-neon-cyan">{featureName}</span> is ready.
            </p>

            {reward && reward.cgt > 0 && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-yellow-400 font-bold text-lg">
                  🎉 +{reward.cgt} CGT Earned!
                </p>
                {reward.hint && (
                  <p className="text-xs text-gray-400 mt-2 italic">{reward.hint}</p>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="px-8 py-3 bg-neon-cyan text-black font-bold rounded-lg hover:bg-neon-cyan/80 transition-colors"
            >
              Awesome!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for easy usage
export function useComingSoon() {
  const [isOpen, setIsOpen] = useState(false);
  const [feature, setFeature] = useState({ name: '', description: '' });

  const showComingSoon = (featureName: string, featureDescription?: string) => {
    setFeature({ name: featureName, description: featureDescription || '' });
    setIsOpen(true);
  };

  const ComingSoonModalComponent = () => (
    <ComingSoonModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      featureName={feature.name}
      featureDescription={feature.description}
    />
  );

  return { showComingSoon, ComingSoonModal: ComingSoonModalComponent };
}
