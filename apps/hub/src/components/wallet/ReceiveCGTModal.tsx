'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiveCGTModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export function ReceiveCGTModal({ isOpen, onClose, address }: ReceiveCGTModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-demiurge-cyan/30 rounded-lg p-6 w-full max-w-md glass-panel">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-demiurge-cyan">Receive CGT</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center bg-white rounded-lg p-4">
            <QRCodeSVG value={address} size={180} />
          </div>

          <div className="bg-gray-800/50 rounded p-3 text-sm font-mono break-all">
            {address}
          </div>

          <button
            onClick={handleCopy}
            className="w-full bg-demiurge-cyan text-black font-bold py-2 rounded hover:bg-demiurge-cyan/80 transition-colors"
          >
            {copied ? 'Copied' : 'Copy Address'}
          </button>
        </div>
      </div>
    </div>
  );
}
