'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { searchDocs, SearchResult } from '@/lib/docs';

interface DocsSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocsSearch({ isOpen, onClose }: DocsSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Search on query change
  useEffect(() => {
    const timer = setTimeout(() => {
      setResults(searchDocs(query));
      setSelectedIndex(0);
    }, 100);
    return () => clearTimeout(timer);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          router.push(results[selectedIndex].href);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, results, selectedIndex, router, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Keyboard shortcut to open (Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl rounded-xl bg-[var(--bg-surface)] border border-white/10 shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <span className="text-xl text-gray-400">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-lg"
          />
          <button
            onClick={onClose}
            className="px-2 py-1 rounded bg-white/5 text-xs text-gray-400 hover:bg-white/10"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={result.href}
                  onClick={() => {
                    router.push(result.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors
                    ${index === selectedIndex ? 'bg-[var(--accent-primary)]/10' : 'hover:bg-white/5'}
                  `}
                >
                  <span className="text-xl">{result.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {result.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                        {result.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {result.description}
                    </p>
                  </div>
                  <span className="text-gray-500 text-sm">↵</span>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="text-xs text-gray-500 mb-2 px-2">Quick Links</div>
              {[
                { icon: '🚀', label: 'Quick Start', href: '/docs/getting-started/5-minute-quickstart' },
                { icon: '📘', label: 'TypeScript SDK', href: '/docs/sdk/typescript' },
                { icon: '📡', label: 'RPC Reference', href: '/docs/developers/rpc-reference' },
                { icon: '⚡', label: 'Validators', href: '/docs/validators' },
              ].map((link) => (
                <button
                  key={link.href}
                  onClick={() => {
                    router.push(link.href);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-gray-300 hover:bg-white/5 transition-colors"
                >
                  <span className="text-lg">{link.icon}</span>
                  <span>{link.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-white/5">↑↓</span>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-white/5">↵</span>
              <span>Select</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-white/5">⌘</span>
            <span className="px-1.5 py-0.5 rounded bg-white/5">K</span>
            <span>to search</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document root
  if (typeof window === 'undefined') return null;
  return createPortal(content, document.body);
}

export default DocsSearch;
