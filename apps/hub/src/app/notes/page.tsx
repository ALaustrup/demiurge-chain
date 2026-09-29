'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface NoteNFT {
  id: string;
  type: 'page_summary' | 'note';
  url?: string;
  title: string;
  summary: string;
  tags: string[];
  capturedAt: string;
  txHash?: string;
}

export default function NotesPage() {
  const { isAuthenticated } = useAuth();
  const [notes, setNotes] = useState<NoteNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    // Notes are DRC-369 NFTs with metadata.type === 'note'
    // Query the blockchain when wallet address is available
    setLoading(false);
  }, [isAuthenticated]);

  // Collect all unique tags
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags)));

  // Filter notes
  const filtered = notes.filter(n => {
    const matchesSearch = !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || n.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="text-5xl block mb-4">📝</span>
          <h1 className="text-2xl font-bold mb-2">Notes & Summaries</h1>
          <p className="text-gray-400">Login to view your DRC-369 note NFTs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">📝</span>
          <div>
            <h1 className="text-3xl font-bold">Notes & Summaries</h1>
            <p className="text-gray-400 text-sm">
              Your DRC-369 note NFTs — page summaries and captures minted on-chain
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                !selectedTag
                  ? 'bg-neon-cyan/20 text-neon-cyan'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                  selectedTag === tag
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-20 h-20 mx-auto bg-white/5 rounded-2xl flex items-center justify-center">
            <span className="text-4xl">🎨</span>
          </div>
          <h2 className="text-xl font-semibold">No Notes Yet</h2>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            Use the Demiurge browser extension to analyze web pages and mint summaries as DRC-369 NFTs.
            They will appear here.
          </p>
          <a
            href="/docs/sdk/wallet-extension"
            className="inline-block mt-2 text-neon-cyan hover:text-neon-cyan/80 text-sm"
          >
            Get the Extension →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((note) => (
            <div
              key={note.id}
              className="glass-panel rounded-xl p-5 border border-white/10 hover:border-neon-cyan/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white line-clamp-2">{note.title}</h3>
                {note.type === 'page_summary' && (
                  <span className="flex-shrink-0 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                    NFT
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-sm line-clamp-4 mb-3">{note.summary}</p>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {note.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-white/5 text-gray-400 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(note.capturedAt).toLocaleDateString()}</span>
                {note.url && (
                  <a
                    href={note.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neon-cyan/70 hover:text-neon-cyan truncate max-w-[200px]"
                  >
                    {note.url.replace(/^https?:\/\//, '').split('/')[0]}
                  </a>
                )}
              </div>
              {note.txHash && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-gray-500 font-mono">
                    TX: {note.txHash.slice(0, 12)}...{note.txHash.slice(-8)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
