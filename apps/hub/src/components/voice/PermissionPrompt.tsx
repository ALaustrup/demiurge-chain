'use client';

import { useState, useCallback } from 'react';

interface PermissionPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
  permissionState: PermissionState | 'unknown';
}

/**
 * PermissionPrompt Component
 * 
 * Guides users through microphone permission grant process.
 * Shows appropriate UI based on current permission state.
 */
export function PermissionPrompt({
  isOpen,
  onClose,
  onPermissionGranted,
  permissionState,
}: PermissionPromptProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      onPermissionGranted();
      onClose();
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Permission denied. Please enable microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError(err.message || 'Failed to access microphone');
      }
    } finally {
      setIsRequesting(false);
    }
  }, [onPermissionGranted, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-md rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(26,26,46,0.98), rgba(22,22,30,0.98))',
          border: '1px solid rgba(0,255,255,0.3)',
          boxShadow: '0 0 40px rgba(0,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div 
          className="p-6 text-center"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,255,255,0.1), transparent)',
          }}
        >
          <div className="text-5xl mb-4">
            {permissionState === 'denied' ? '🔇' : '🎤'}
          </div>
          <h2 className="font-grunge text-2xl text-neon-cyan mb-2">
            {permissionState === 'denied' 
              ? 'Microphone Access Blocked'
              : 'Enable Voice Chat'
            }
          </h2>
          <p className="text-gray-400 text-sm">
            {permissionState === 'denied'
              ? 'Voice features require microphone access'
              : 'Allow microphone access to use voice features'
            }
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {permissionState === 'denied' ? (
            /* Permission Denied State */
            <div className="space-y-4">
              <div 
                className="p-4 rounded-lg"
                style={{
                  background: 'rgba(255,100,100,0.1)',
                  border: '1px solid rgba(255,100,100,0.3)',
                }}
              >
                <p className="text-red-400 text-sm mb-3">
                  Microphone access was denied. To enable voice chat:
                </p>
                <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
                  <li>Click the lock/info icon in your browser's address bar</li>
                  <li>Find "Microphone" in the permissions list</li>
                  <li>Change the setting to "Allow"</li>
                  <li>Refresh the page and try again</li>
                </ol>
              </div>

              {/* Browser-specific instructions */}
              <div className="text-xs text-gray-500 text-center">
                <p>Or go to your browser settings:</p>
                <p className="text-gray-400 mt-1">
                  <code className="bg-black/30 px-2 py-0.5 rounded">
                    chrome://settings/content/microphone
                  </code>
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
              >
                Got it
              </button>
            </div>
          ) : (
            /* Permission Request State */
            <div className="space-y-4">
              {/* Features list */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                  <span className="text-2xl">🗣️</span>
                  <div>
                    <p className="text-white font-medium">Sophia Voice Mode</p>
                    <p className="text-gray-400 text-sm">Talk directly with Sophia using the Ara voice</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                  <span className="text-2xl">👥</span>
                  <div>
                    <p className="text-white font-medium">Voice Chat</p>
                    <p className="text-gray-400 text-sm">Real-time voice conversations with other users</p>
                  </div>
                </div>
              </div>

              {/* Error display */}
              {error && (
                <div 
                  className="p-3 rounded-lg text-sm"
                  style={{
                    background: 'rgba(255,100,100,0.1)',
                    border: '1px solid rgba(255,100,100,0.3)',
                    color: '#FF6B6B',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Privacy note */}
              <p className="text-xs text-gray-500 text-center">
                Your voice is only used for active conversations and is never stored.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                >
                  Not Now
                </button>
                <button
                  onClick={requestPermission}
                  disabled={isRequesting}
                  className="flex-1 py-3 rounded-lg font-grunge-alt disabled:opacity-50 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #00FFFF, #00CCCC)',
                    color: '#0a0a0f',
                  }}
                >
                  {isRequesting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Requesting...
                    </span>
                  ) : (
                    'Enable Microphone'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact permission button that shows current state
 */
interface PermissionButtonProps {
  permissionState: PermissionState | 'unknown';
  onClick: () => void;
  className?: string;
}

export function PermissionButton({
  permissionState,
  onClick,
  className = '',
}: PermissionButtonProps) {
  const getStateInfo = () => {
    switch (permissionState) {
      case 'granted':
        return { icon: '🎤', text: 'Microphone enabled', color: 'text-green-400' };
      case 'denied':
        return { icon: '🔇', text: 'Microphone blocked', color: 'text-red-400' };
      case 'prompt':
      case 'unknown':
      default:
        return { icon: '🎙️', text: 'Enable microphone', color: 'text-gray-400' };
    }
  };

  const { icon, text, color } = getStateInfo();

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${className}`}
    >
      <span>{icon}</span>
      <span className={`text-sm ${color}`}>{text}</span>
    </button>
  );
}
