'use client';

import { useState } from 'react';

interface Interest {
  id: string;
  label: string;
  icon: string;
}

interface FavoriteGame {
  id: string;
  name: string;
  icon?: string;
}

interface AboutMeProps {
  bio?: string;
  interests?: Interest[];
  favoriteGames?: FavoriteGame[];
  skills?: string[];
  currentProjects?: { name: string; description: string; url?: string }[];
  isOwnProfile?: boolean;
  onUpdate?: (data: any) => void;
}

const AVAILABLE_INTERESTS = [
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'art', label: 'Digital Art', icon: '🎨' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'coding', label: 'Coding', icon: '💻' },
  { id: 'crypto', label: 'Crypto', icon: '₿' },
  { id: 'nfts', label: 'NFTs', icon: '💎' },
  { id: 'trading', label: 'Trading', icon: '📈' },
  { id: 'photography', label: 'Photography', icon: '📷' },
  { id: 'movies', label: 'Movies', icon: '🎬' },
  { id: 'anime', label: 'Anime', icon: '🌸' },
  { id: 'books', label: 'Books', icon: '📚' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'food', label: 'Food', icon: '🍕' },
  { id: 'streaming', label: 'Streaming', icon: '📺' },
  { id: 'esports', label: 'Esports', icon: '🏆' },
];

export function AboutMe({
  bio = '',
  interests = [],
  favoriteGames = [],
  skills = [],
  currentProjects = [],
  isOwnProfile = false,
  onUpdate
}: AboutMeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    bio,
    interests,
    skills,
    currentProjects
  });

  // Use provided data or empty values - no mock fallbacks
  const displayData = {
    bio: bio,
    interests: interests,
    favoriteGames: favoriteGames,
    skills: skills,
    currentProjects: currentProjects,
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editData);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="glass-panel rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-grunge-alt text-xl text-neon-cyan">Edit About Me</h2>
          <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white">✕</button>
        </div>

        {/* Bio Edit */}
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Bio</label>
          <textarea
            value={editData.bio}
            onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
            className="w-full bg-white/90 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-neon-cyan/50 focus:outline-none resize-none"
            rows={5}
            maxLength={500}
            placeholder="Tell the world about yourself..."
          />
          <span className="text-xs text-gray-500 block text-right">{editData.bio.length}/500</span>
        </div>

        {/* Interests Edit */}
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Interests (select up to 8)</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_INTERESTS.map((interest) => {
              const isSelected = editData.interests.some(i => i.id === interest.id);
              return (
                <button
                  key={interest.id}
                  onClick={() => {
                    if (isSelected) {
                      setEditData({
                        ...editData,
                        interests: editData.interests.filter(i => i.id !== interest.id)
                      });
                    } else if (editData.interests.length < 8) {
                      setEditData({
                        ...editData,
                        interests: [...editData.interests, interest]
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    isSelected
                      ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                      : 'bg-blockchain-light/50 border border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {interest.icon} {interest.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Skills Edit */}
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Skills (comma separated)</label>
          <input
            type="text"
            value={editData.skills.join(', ')}
            onChange={(e) => setEditData({
              ...editData,
              skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
            })}
            className="w-full bg-white/90 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-neon-cyan/50 focus:outline-none"
            placeholder="Rust, React, Game Design..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button onClick={() => setIsEditing(false)} className="flex-1 glass-panel py-2 rounded-lg">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 neon-button py-2 rounded-lg">
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bio Section */}
      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-grunge-alt text-xl text-neon-cyan flex items-center gap-2">
            📖 About Me
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-500 hover:text-neon-cyan transition-colors text-sm"
            >
              ✏️ Edit
            </button>
          )}
        </div>
        {displayData.bio ? (
          <p className="text-gray-300 font-body whitespace-pre-wrap leading-relaxed">
            {displayData.bio}
          </p>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? 'Click Edit to add a bio about yourself.' : 'No bio yet.'}
          </p>
        )}
      </div>

      {/* Interests */}
      {displayData.interests.length > 0 && (
        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-grunge-alt text-lg text-neon-purple mb-4 flex items-center gap-2">
            ✨ Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {displayData.interests.map((interest) => (
              <span
                key={interest.id}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border border-neon-cyan/20 text-white text-sm"
              >
                {interest.icon} {interest.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {displayData.skills.length > 0 && (
        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-grunge-alt text-lg text-green-400 mb-4 flex items-center gap-2">
            🛠️ Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {displayData.skills.map((skill, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Games */}
      {displayData.favoriteGames.length > 0 && (
        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-grunge-alt text-lg text-yellow-400 mb-4 flex items-center gap-2">
            🎮 Favorite Games
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {displayData.favoriteGames.map((game) => (
              <button
                key={game.id}
                className="p-3 rounded-lg bg-blockchain-light/50 border border-gray-700 hover:border-yellow-400/50 transition-colors text-center group"
              >
                <span className="text-2xl block mb-1 group-hover:scale-110 transition-transform">
                  {game.icon || '🎮'}
                </span>
                <span className="text-white text-sm">{game.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Projects */}
      {displayData.currentProjects.length > 0 && (
        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-grunge-alt text-lg text-blue-400 mb-4 flex items-center gap-2">
            🚀 Current Projects
          </h3>
          <div className="space-y-3">
            {displayData.currentProjects.map((project, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-blockchain-light/30 border border-gray-700 hover:border-blue-400/50 transition-colors"
              >
                <h4 className="text-white font-body font-semibold">{project.name}</h4>
                <p className="text-gray-400 text-sm mt-1">{project.description}</p>
                {project.url && (
                  <a href={project.url} className="text-blue-400 text-sm mt-2 inline-block hover:underline">
                    View Project →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
