import { useState, useEffect } from "react";
import { Wallet, LogOut, Copy, Check, ExternalLink } from "lucide-react";

export default function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected (from localStorage)
    if (typeof window !== "undefined") {
      const savedAccount = localStorage.getItem("drc369_wallet");
      if (savedAccount) {
        setAccount(savedAccount);
        setIsConnected(true);
      }
    }
  }, []);

  const connectWallet = async () => {
    // For demo purposes, generate a mock Substrate address
    // In production, this would connect to actual Substrate wallet
    const mockAddress =
      "5" +
      Array.from(
        { length: 47 },
        () =>
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[
            Math.floor(Math.random() * 62)
          ],
      ).join("");

    setAccount(mockAddress);
    setIsConnected(true);
    setShowModal(false);

    if (typeof window !== "undefined") {
      localStorage.setItem("drc369_wallet", mockAddress);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("drc369_wallet");
    }
  };

  const copyAddress = () => {
    if (account && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnected && account) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowModal(!showModal)}
          className="h-10 px-4 md:px-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white font-semibold text-sm transition-all duration-150 hover:shadow-lg hover:scale-105 active:scale-95 font-inter flex items-center gap-2"
        >
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="hidden sm:inline">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          <span className="sm:hidden">Connected</span>
        </button>

        {showModal && (
          <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#1E1E1E] border border-[#E6E6E6] dark:border-[#333333] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4 border-b border-[#E6E6E6] dark:border-[#333333] bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Wallet size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-black dark:text-white font-inter">
                    Connected Wallet
                  </p>
                  <p className="text-xs text-black/60 dark:text-white/60 font-inter">
                    Demiurge Network
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-black/60 dark:text-white/60 font-inter mb-2">
                  Account Address
                </p>
                <div className="flex items-center gap-2 p-3 bg-[#F9FAFB] dark:bg-[#262626] rounded-lg">
                  <code className="flex-1 text-xs font-mono text-black dark:text-white truncate">
                    {account}
                  </code>
                  <button
                    onClick={copyAddress}
                    className="p-1.5 rounded hover:bg-white dark:hover:bg-[#1E1E1E] transition-all duration-150"
                  >
                    {copied ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy
                        size={14}
                        className="text-black/40 dark:text-white/40"
                      />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-inter mb-1">
                    Balance
                  </p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300 font-sora">
                    1,234 DMR
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-inter mb-1">
                    Assets
                  </p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300 font-sora">
                    5
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full px-4 py-2 rounded-lg border border-[#E6E6E6] dark:border-[#333333] text-black dark:text-white font-semibold hover:bg-[#F9FAFB] dark:hover:bg-[#262626] transition-all duration-150 font-inter text-sm flex items-center justify-center gap-2">
                  <ExternalLink size={16} />
                  View on Explorer
                </button>
                <button
                  onClick={disconnectWallet}
                  className="w-full px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-all duration-150 font-inter text-sm flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="h-10 px-4 md:px-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 text-white font-semibold text-sm transition-all duration-150 hover:shadow-lg hover:scale-105 active:scale-95 font-inter flex items-center gap-2"
      >
        <Wallet size={16} />
        <span className="hidden sm:inline">Connect</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-[#E6E6E6] dark:border-[#333333] bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <h3 className="text-2xl font-bold text-black dark:text-white font-sora mb-2">
                Connect Wallet
              </h3>
              <p className="text-sm text-black/60 dark:text-white/60 font-inter">
                Connect your Substrate wallet to interact with DRC-369 assets
              </p>
            </div>

            <div className="p-6 space-y-3">
              <button
                onClick={connectWallet}
                className="w-full p-4 rounded-xl border-2 border-[#E6E6E6] dark:border-[#333333] hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-150 flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Wallet size={24} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-black dark:text-white font-inter group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    Polkadot.js Extension
                  </p>
                  <p className="text-xs text-black/60 dark:text-white/60 font-inter">
                    Connect using browser extension
                  </p>
                </div>
              </button>

              <button
                onClick={connectWallet}
                className="w-full p-4 rounded-xl border-2 border-[#E6E6E6] dark:border-[#333333] hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-150 flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Wallet size={24} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-black dark:text-white font-inter group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    Talisman
                  </p>
                  <p className="text-xs text-black/60 dark:text-white/60 font-inter">
                    Connect using Talisman wallet
                  </p>
                </div>
              </button>

              <button
                onClick={connectWallet}
                className="w-full p-4 rounded-xl border-2 border-[#E6E6E6] dark:border-[#333333] hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-150 flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Wallet size={24} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-black dark:text-white font-inter group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    SubWallet
                  </p>
                  <p className="text-xs text-black/60 dark:text-white/60 font-inter">
                    Connect using SubWallet
                  </p>
                </div>
              </button>
            </div>

            <div className="p-4 border-t border-[#E6E6E6] dark:border-[#333333] bg-[#F9FAFB] dark:bg-[#0A0A0A]">
              <p className="text-xs text-black/60 dark:text-white/60 text-center font-inter">
                By connecting, you agree to the Demiurge Network Terms of
                Service
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-3 px-4 py-2 rounded-lg border border-[#E6E6E6] dark:border-[#333333] text-black dark:text-white font-semibold hover:bg-white dark:hover:bg-[#1E1E1E] transition-all duration-150 font-inter text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
