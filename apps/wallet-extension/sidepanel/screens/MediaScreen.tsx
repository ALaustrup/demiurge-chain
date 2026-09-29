// Demiurge Side Panel - Media Gallery Screen
import React, { useState, useEffect } from 'react';
import type { SavedMedia } from '../../shared/types';

export function MediaScreen() {
  const [media, setMedia] = useState<SavedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'link'>('all');

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_MEDIA' });
      if (response.success) {
        setMedia(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const filtered = filter === 'all' ? media : media.filter(m => m.type === filter);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <h2 className="text-sm font-semibold text-white">
          Media ({filtered.length})
        </h2>
        <div className="flex gap-1">
          {(['all', 'image', 'link'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                filter === f
                  ? 'bg-demiurge-500/20 text-demiurge-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {f === 'all' ? 'All' : f === 'image' ? 'Images' : 'Links'}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-demiurge-500 border-t-transparent rounded-full spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-3xl block mb-2">🖼</span>
            <p className="text-gray-400 text-sm">No saved media yet.</p>
            <p className="text-gray-500 text-xs mt-1">
              Right-click images or links on any page to save them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-2 hover:border-demiurge-500/50 transition-colors group"
              >
                {item.type === 'image' ? (
                  <div className="aspect-square rounded-lg bg-gray-900/50 overflow-hidden mb-2">
                    <img
                      src={item.url}
                      alt={item.title || ''}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-gray-900/50 flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 truncate group-hover:text-gray-200">
                  {item.title || new URL(item.url).hostname}
                </p>
                <p className="text-[9px] text-gray-500">{formatDate(item.createdAt)}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
