'use client';

import { useState } from 'react';

interface MoodStatusProps {
  currentMood?: string;
  currentStatus?: string;
  workingOn?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  isOwnProfile?: boolean;
  onUpdate?: (mood: string, status: string, workingOn: string) => void;
}

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😎', label: 'Creative' },
  { emoji: '🔥', label: 'On Fire' },
  { emoji: '💪', label: 'Motivated' },
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '💻', label: 'Coding' },
  { emoji: '🎵', label: 'Vibing' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '☕', label: 'Caffeinated' },
  { emoji: '🚀', label: 'Shipping' },
  { emoji: '💎', label: 'Diamond' },
];

export function MoodStatus({
  currentMood = '😎',
  currentStatus = 'Building something cool...',
  workingOn = '',
  isOnline = true,
  lastSeen,
  isOwnProfile = false,
  onUpdate
}: MoodStatusProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [mood, setMood] = useState(currentMood);
  const [status, setStatus] = useState(currentStatus);
  const [working, setWorking] = useState(workingOn);
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(mood, status, working);
    }
    setIsEditing(false);
    setShowMoodPicker(false);
  };

  const formatLastSeen = (date?: Date) => {
    if (!date) return 'Unknown';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getMoodLabel = (emoji: string) => {
    return MOOD_OPTIONS.find(m => m.emoji === emoji)?.label || 'Neutral';
  };

  if (!isEditing) {
    return (
      <div className="glass-panel p-4 rounded-xl">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Online Status */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className={`text-sm ${isOnline ? 'text-green-400' : 'text-gray-500'}`}>
                {isOnline ? 'Online' : `Last seen ${formatLastSeen(lastSeen)}`}
              </span>
            </div>

            {/* Mood */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{mood}</span>
              <span className="text-gray-400 text-sm">
                Feeling <span className="text-white">{getMoodLabel(mood)}</span>
              </span>
            </div>

            {/* Status */}
            {status && (
              <p className="text-white font-body italic text-sm mb-2">
                "{status}"
              </p>
            )}

            {/* Working On */}
            {working && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">🔨 Working on:</span>
                <span className="text-neon-cyan">{working}</span>
              </div>
            )}
          </div>

          {isOwnProfile && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-500 hover:text-neon-cyan transition-colors"
            >
              ✏️
            </button>
          )}
        </div>
      </div>
    );
  }

  // Editing Mode
  return (
    <div className="glass-panel p-4 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-grunge-alt text-lg text-neon-cyan">Update Status</h3>
        <button
          onClick={() => {
            setIsEditing(false);
            setShowMoodPicker(false);
          }}
          className="text-gray-500 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Mood Selector */}
      <div>
        <label className="text-gray-400 text-sm mb-2 block">How are you feeling?</label>
        <div className="relative">
          <button
            onClick={() => setShowMoodPicker(!showMoodPicker)}
            className="w-full flex items-center gap-2 bg-blockchain-light/50 border border-gray-700 rounded-lg px-4 py-3 text-left hover:border-neon-cyan/50 transition-colors"
          >
            <span className="text-2xl">{mood}</span>
            <span className="text-white">{getMoodLabel(mood)}</span>
            <span className="ml-auto text-gray-500">▼</span>
          </button>
          
          {showMoodPicker && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-blockchain-dark border border-gray-700 rounded-lg p-3 z-10 shadow-xl">
              <div className="grid grid-cols-6 gap-2">
                {MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.emoji}
                    onClick={() => {
                      setMood(option.emoji);
                      setShowMoodPicker(false);
                    }}
                    className={`p-2 rounded-lg text-center hover:bg-neon-cyan/20 transition-colors ${
                      mood === option.emoji ? 'bg-neon-cyan/20 ring-1 ring-neon-cyan' : ''
                    }`}
                    title={option.label}
                  >
                    <span className="text-2xl block">{option.emoji}</span>
                    <span className="text-xs text-gray-400">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Input */}
      <div>
        <label className="text-gray-400 text-sm mb-2 block">What's on your mind?</label>
        <input
          type="text"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="Share a quick thought..."
          maxLength={100}
          className="w-full bg-white/90 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-neon-cyan/50 focus:outline-none"
        />
        <span className="text-xs text-gray-500 mt-1 block text-right">{status.length}/100</span>
      </div>

      {/* Working On Input */}
      <div>
        <label className="text-gray-400 text-sm mb-2 block">What are you working on?</label>
        <input
          type="text"
          value={working}
          onChange={(e) => setWorking(e.target.value)}
          placeholder="e.g., New NFT collection, Game update..."
          maxLength={50}
          className="w-full bg-white/90 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-neon-cyan/50 focus:outline-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setIsEditing(false);
            setMood(currentMood);
            setStatus(currentStatus);
            setWorking(workingOn);
          }}
          className="flex-1 glass-panel py-2 rounded-lg hover:border-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 neon-button py-2 rounded-lg"
        >
          Update Status
        </button>
      </div>
    </div>
  );
}
