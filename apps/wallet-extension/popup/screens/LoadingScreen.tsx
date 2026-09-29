// Demiurge Wallet Extension - Loading Screen
import React from 'react';

export function LoadingScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 bg-gradient-to-br from-demiurge-400 to-demiurge-600 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
        <span className="text-white font-bold text-2xl">D</span>
      </div>
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 spinner text-demiurge-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-gray-400">Loading wallet...</span>
      </div>
    </div>
  );
}
