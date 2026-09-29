// Demiurge Side Panel - Notes Screen
import React, { useState, useEffect } from 'react';
import type { SavedNote } from '../../shared/types';

export function NotesScreen() {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_NOTES' });
      if (response.success) {
        setNotes(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleCreateNote = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      const tab = await new Promise<chrome.tabs.Tab | undefined>((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs[0]));
      });

      await chrome.runtime.sendMessage({
        type: 'SAVE_NOTE',
        payload: {
          title: newTitle.trim(),
          content: newContent.trim(),
          url: tab?.url,
          tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
        },
      });

      setNewTitle('');
      setNewContent('');
      setNewTags('');
      setShowCreate(false);
      loadNotes();
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await chrome.runtime.sendMessage({ type: 'DELETE_NOTE', payload: { id } });
      setNotes(notes.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <h2 className="text-sm font-semibold text-white">
          Notes ({notes.length})
        </h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-xs px-3 py-1.5 bg-demiurge-500 hover:bg-demiurge-600 text-white rounded-lg transition-colors"
        >
          {showCreate ? 'Cancel' : '+ New Note'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="px-4 pb-3 flex-shrink-0 space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Note title"
            className="input text-sm"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write your note..."
            rows={4}
            className="input text-sm resize-none"
          />
          <input
            type="text"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            placeholder="Tags (comma-separated)"
            className="input text-sm"
          />
          <button
            onClick={handleCreateNote}
            disabled={!newTitle.trim() || !newContent.trim()}
            className="w-full py-2 bg-demiurge-500 hover:bg-demiurge-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Save Note
          </button>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-demiurge-500 border-t-transparent rounded-full spinner" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-3xl block mb-2">📝</span>
            <p className="text-gray-400 text-sm">No notes yet.</p>
            <p className="text-gray-500 text-xs mt-1">
              Right-click text on any page to save it, or create a note above.
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-white truncate flex-1">{note.title}</h3>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="ml-2 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-300 text-xs line-clamp-3 mb-2">{note.content}</p>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {note.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-demiurge-500/20 text-demiurge-400 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">{formatDate(note.createdAt)}</span>
                {note.url && (
                  <a
                    href={note.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-demiurge-400 hover:text-demiurge-300 truncate max-w-[150px]"
                  >
                    {new URL(note.url).hostname}
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
