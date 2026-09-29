// Demiurge Side Panel - Main App
import React, { useState, useEffect } from 'react';
import { SophiaScreen } from './screens/SophiaScreen';
import { NotesScreen } from './screens/NotesScreen';
import { MediaScreen } from './screens/MediaScreen';
import { VYBChatScreen } from './screens/VYBChatScreen';

type Tab = 'sophia' | 'notes' | 'media' | 'chat';

export function SidePanelApp() {
  const [activeTab, setActiveTab] = useState<Tab>('sophia');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<{ qorId: string; displayName?: string } | null>(null);

  useEffect(() => {
    // Check auth state from background
    chrome.runtime.sendMessage({ type: 'AUTH_GET_SESSION' }, (response) => {
      if (response?.success && response.data?.isAuthenticated) {
        setIsAuthenticated(true);
        setAuthUser(response.data.user);
      }
    });
  }, []);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'sophia', label: 'Sophia', icon: '🧠' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'media', label: 'Media', icon: '🖼' },
    { id: 'chat', label: 'VYB Chat', icon: '💬' },
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-demiurge-400 to-demiurge-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">D</span>
          </div>
          <span className="font-semibold text-white text-sm">Demiurge</span>
        </div>
        {isAuthenticated && authUser && (
          <span className="text-xs text-gray-400 truncate max-w-[120px]">
            {authUser.displayName || authUser.qorId}
          </span>
        )}
      </header>

      {/* Tab Bar */}
      <nav className="flex border-b border-gray-700/50 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-demiurge-400 border-b-2 border-demiurge-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'sophia' && <SophiaScreen />}
        {activeTab === 'notes' && <NotesScreen />}
        {activeTab === 'media' && <MediaScreen />}
        {activeTab === 'chat' && <VYBChatScreen />}
      </main>
    </div>
  );
}
