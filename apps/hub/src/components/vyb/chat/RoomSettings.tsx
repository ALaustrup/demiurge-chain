'use client';

import { useState } from 'react';
import { useChatAPI } from './useChatAPI';

interface RoomSettingsProps {
  onClose: () => void;
  onCreated: (room: any) => void;
}

export function RoomSettings({ onClose, onCreated }: RoomSettingsProps) {
  const { createRoom } = useChatAPI();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const room = await createRoom(
        name.trim(),
        description.trim(),
        type,
        type === 'private' ? password : undefined,
      );
      onCreated(room);
    } catch (err) {
      setError((err as Error).message || 'Failed to create room');
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel w-full max-w-md rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg text-white font-medium">Create Room</h3>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Room Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Room"
              className="w-full bg-architect-input border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-neon-cyan/50 focus:outline-none"
              maxLength={50}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this room about?"
              className="w-full bg-architect-input border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-neon-cyan/50 focus:outline-none"
              maxLength={200}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Room Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setType('public')}
                className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                  type === 'public' ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' : 'border-gray-700 text-gray-400'
                }`}
              >
                # Public
              </button>
              <button
                onClick={() => setType('private')}
                className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                  type === 'private' ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' : 'border-gray-700 text-gray-400'
                }`}
              >
                🔒 Private
              </button>
            </div>
          </div>

          {type === 'private' && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Room password"
                className="w-full bg-architect-input border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-neon-cyan/50 focus:outline-none"
              />
            </div>
          )}

          {error && (
            <p className="text-signal-error text-sm">{error}</p>
          )}
        </div>

        <div className="p-4 border-t border-gray-800 flex gap-2">
          <button onClick={onClose} className="flex-1 glass-panel py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="flex-1 py-2 rounded-lg text-sm bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/30 disabled:opacity-30 transition-colors"
          >
            {creating ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
}
