'use client';

import { useState } from 'react';

interface ReportArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: string;
  artistName: string;
}

const REPORT_REASONS = [
  { id: 'impersonation', label: 'Impersonating another artist', description: 'This account is pretending to be a well-known artist or band' },
  { id: 'fake_content', label: 'Fake or stolen content', description: 'The music uploaded is not original or belongs to someone else' },
  { id: 'misleading', label: 'Misleading information', description: 'Profile contains false or misleading information' },
  { id: 'spam', label: 'Spam or scam', description: 'This account is being used for spam or fraudulent purposes' },
  { id: 'other', label: 'Other violation', description: 'Other terms of service violation' },
];

export function ReportArtistModal({ isOpen, onClose, artistId, artistName }: ReportArtistModalProps) {
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [realArtistLink, setRealArtistLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason for reporting');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/music/artist/${artistId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          details,
          realArtistLink,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setDetails('');
    setRealArtistLink('');
    setSubmitted(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-panel p-6 max-w-lg w-full mx-4 rounded-xl border border-red-500/30">
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Report Submitted</h2>
            <p className="text-gray-400 mb-6">
              Thank you for helping keep QOR MUSIC safe. Our team will review your report.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-magenta text-black font-bold rounded-lg"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Report Artist</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-white text-2xl">
                ✕
              </button>
            </div>

            <p className="text-gray-400 mb-4">
              Reporting <span className="text-white font-semibold">{artistName}</span>
            </p>

            <div className="space-y-4">
              {/* Reason selection */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Reason for Report *</label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.id}
                      className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                        reason === r.id
                          ? 'border-neon-magenta bg-neon-magenta/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="reason"
                          value={r.id}
                          checked={reason === r.id}
                          onChange={(e) => setReason(e.target.value)}
                          className="mt-1"
                        />
                        <div>
                          <div className="text-white font-medium">{r.label}</div>
                          <div className="text-sm text-gray-500">{r.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Real artist link (for impersonation) */}
              {reason === 'impersonation' && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Link to real artist profile (optional)
                  </label>
                  <input
                    type="url"
                    value={realArtistLink}
                    onChange={(e) => setRealArtistLink(e.target.value)}
                    placeholder="https://spotify.com/artist/... or https://soundcloud.com/..."
                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-neon-magenta focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Providing a link to the real artist helps us verify the impersonation
                  </p>
                </div>
              )}

              {/* Additional details */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Additional Details (optional)</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any additional information that might help our review..."
                  rows={3}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-neon-magenta focus:outline-none resize-none"
                  maxLength={500}
                />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 glass-panel py-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !reason}
                  className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface VerificationBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function VerificationBadge({ isVerified, size = 'md' }: VerificationBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  if (isVerified) {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} bg-neon-cyan/20 text-neon-cyan rounded-full`}>
        <span>✓</span>
        <span>Verified</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} bg-yellow-500/20 text-yellow-400 rounded-full`}>
      <span>⚠</span>
      <span>Unverified</span>
    </span>
  );
}

interface VerificationInfoProps {
  isVerified: boolean;
}

export function VerificationInfo({ isVerified }: VerificationInfoProps) {
  if (isVerified) {
    return (
      <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-neon-cyan text-xl">✓</span>
          <h4 className="text-neon-cyan font-bold">Verified Artist</h4>
        </div>
        <p className="text-gray-400 text-sm">
          This artist has verified their identity through official social media or streaming platforms.
          Verified artists have confirmed ownership of their brand and content.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-yellow-400 text-xl">⚠</span>
        <h4 className="text-yellow-400 font-bold">Unverified Artist</h4>
      </div>
      <p className="text-gray-400 text-sm">
        This artist has not been verified. While many unverified artists are legitimate,
        please be cautious of potential impersonators. If you believe this account is
        impersonating someone else, please report it.
      </p>
    </div>
  );
}
