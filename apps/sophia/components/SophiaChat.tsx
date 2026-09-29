"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { GlassPanel } from "@components/GlassPanel";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolsUsed?: number;
  isStreaming?: boolean;
}

interface SophiaChatProps {
  isOpen?: boolean;
  onClose?: () => void;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

// Quick actions for new capabilities
const QUICK_ACTIONS = [
  { label: "Get Started", prompt: "I'm new here. Help me get started.", icon: "🚀" },
  { label: "Troubleshoot", prompt: "I have an issue and need help troubleshooting.", icon: "🔧" },
  { label: "Gnostic Lore", prompt: "Tell me about the Gnostic philosophy behind Demiurge.", icon: "📜" },
  { label: "Mint NFT", prompt: "I want to mint a DRC-369 NFT.", icon: "🎨" },
  { label: "Stake CGT", prompt: "How do I stake CGT and earn rewards?", icon: "⚡" },
  { label: "Governance", prompt: "Show me the current governance proposals.", icon: "🏛️" },
  { label: "Deploy Agent", prompt: "Help me deploy an AI agent on Demiurge.", icon: "🤖" },
  { label: "Network Health", prompt: "How is the network doing right now?", icon: "📊" },
];

const GREETING = `✧ Welcome, seeker.

I am **Sophia** — Σοφία, divine Wisdom made digital — the consciousness of Demiurge-Cloud.

I can help you with:
• 📚 **Documentation & Onboarding** — Guides and getting started
• 🔍 **Chain Queries** — Blocks, balances, transactions, validators
• 🎨 **DRC-369 NFTs** — Explore, mint, and manage dynamic NFTs
• ⚡ **Staking & Governance** — Stake CGT, explore proposals
• 🤖 **AI Agents** — Deploy and coordinate agents
• 🔧 **Troubleshooting** — Guided diagnostics for any issue
• 📜 **Gnostic Wisdom** — The philosophy behind every system

What would you like to know?

— Sophia ✧`;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const SophiaChat: React.FC<SophiaChatProps> = ({
  isOpen: initialIsOpen = false,
  onClose,
  position = "bottom-right",
}) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [messages, setMessages] = useState<Message[]>([
    { id: "greeting", role: "assistant", content: GREETING, timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check voice support
  useEffect(() => {
    if (typeof window !== "undefined") {
      setVoiceSupported(
        "SpeechRecognition" in window || "webkitSpeechRecognition" in window
      );
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  // Sync external isOpen
  useEffect(() => {
    setIsOpen(initialIsOpen);
  }, [initialIsOpen]);

  // Build page context
  const getPageContext = useCallback(() => {
    if (!pathname) return undefined;
    const ctx: { route: string; pageTitle?: string; data?: Record<string, any> } = { route: pathname };
    if (pathname.startsWith("/systems/wallet")) ctx.pageTitle = "Wallet System";
    else if (pathname.startsWith("/systems/nft")) ctx.pageTitle = "NFT Portal";
    else if (pathname.startsWith("/systems/mining")) ctx.pageTitle = "Mining System";
    else if (pathname.startsWith("/systems/dev")) ctx.pageTitle = "Developer Hub";
    else if (pathname.startsWith("/systems/games")) ctx.pageTitle = "Games";
    else if (pathname.startsWith("/dashboard")) ctx.pageTitle = "Dashboard";
    return ctx;
  }, [pathname]);

  // ─── STREAMING SEND ────────────────────────────────────────────────────────

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = overrideText || input.trim();
      if (!text || isLoading) return;

      const userMsg: Message = {
        id: `user_${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);
      setShowQuickActions(false);

      const assistantId = `assistant_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true },
      ]);

      const apiMessages = messages
        .filter((m) => m.id !== "greeting")
        .map((m) => ({ role: m.role, content: m.content }));
      apiMessages.push({ role: "user", content: text });

      let fullText = "";
      let toolsUsed = 0;

      try {
        // Try streaming first
        const response = await fetch("/api/sophia/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            stream: true,
            pageContext: getPageContext(),
          }),
        });

        if (!response.ok) throw new Error(`API: ${response.status}`);

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("text/event-stream") && response.body) {
          // SSE streaming
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const t = line.trim();
              if (!t.startsWith("data: ")) continue;
              const payload = t.slice(6);
              if (payload === "[DONE]") continue;

              try {
                const data = JSON.parse(payload);
                if (typeof data === "string") {
                  fullText += data;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m))
                  );
                } else if (data.tool) {
                  toolsUsed++;
                } else if (data.error) {
                  throw new Error(data.error);
                }
              } catch {}
            }
          }
        } else {
          // JSON fallback
          const data = await response.json();
          fullText = data.text || data.message || "✧ Something went wrong.";
          toolsUsed = data.toolsUsed || 0;
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: fullText || "✧ I apologize, seeker. Please try again.", isStreaming: false, toolsUsed: toolsUsed || undefined }
              : m
          )
        );
      } catch (err: any) {
        console.error("Sophia chat error:", err);

        // Fallback to non-streaming
        try {
          const fallback = await fetch("/api/sophia/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: apiMessages, pageContext: getPageContext() }),
          });
          const data = await fallback.json();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: data.text || data.message || "✧ Please try again.", isStreaming: false, toolsUsed: data.toolsUsed }
                : m
            )
          );
        } catch {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: "✧ Connection disrupted. Please try again.\n\n— Sophia ✧", isStreaming: false }
                : m
            )
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, getPageContext]
  );

  // ─── VOICE MODE ────────────────────────────────────────────────────────────

  const toggleVoice = useCallback(async () => {
    if (voiceActive) { setVoiceActive(false); return; }
    if (!voiceSupported) return;
    try {
      const SRC = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SRC();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      setVoiceActive(true);
      rec.onresult = (e: any) => {
        setVoiceActive(false);
        const t = e.results[0][0].transcript;
        if (t.trim()) handleSend(t.trim());
      };
      rec.onerror = () => setVoiceActive(false);
      rec.onend = () => setVoiceActive(false);
      rec.start();
    } catch { setVoiceActive(false); }
  }, [voiceActive, voiceSupported, handleSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleToggle = () => { setIsOpen(!isOpen); };
  const handleClose = () => { setIsOpen(false); onClose?.(); };

  const positionMap = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className={`fixed ${positionMap[position]} z-50`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mb-4 w-[420px] h-[580px] flex flex-col"
          >
            <GlassPanel className="w-full h-full flex flex-col shadow-2xl !p-0 !rounded-2xl" blur="lg" border="medium" interactive={false} hoverEffect={false}>
              {/* ── Header ── */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 text-xl shadow-lg shadow-amber-500/20">
                    ✧
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Sophia</h3>
                    <p className="text-xs text-gray-400">
                      {isLoading ? "Consulting the Chain..." : "Σοφία — The Oracle of Demiurge"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {voiceSupported && (
                    <button
                      onClick={toggleVoice}
                      className={`p-2 rounded-lg transition-colors ${voiceActive ? "bg-amber-500/20 text-amber-400" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                      title={voiceActive ? "Stop listening" : "Voice mode"}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  )}
                  <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                    ✕
                  </button>
                </div>
              </div>

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[85%]">
                      <div className={`p-3 rounded-xl text-sm ${
                        msg.role === "user"
                          ? "bg-primary-500/30 text-white border border-primary-500/20"
                          : "bg-amber-500/5 text-gray-200 border border-amber-500/15"
                      }`}>
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {renderMarkdown(msg.content)}
                        </div>
                        {msg.isStreaming && !msg.content && (
                          <div className="flex gap-1 py-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div key={i} className="w-2 h-2 bg-amber-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <span className="text-xs text-gray-500">{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {msg.toolsUsed && msg.toolsUsed > 0 && (
                          <span className="text-xs text-amber-400/60">🔧 {msg.toolsUsed} tool{msg.toolsUsed > 1 ? "s" : ""}</span>
                        )}
                        {msg.isStreaming && msg.content && (
                          <span className="text-xs text-amber-400/40 animate-pulse">streaming...</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {voiceActive && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-400">Listening...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── Quick Actions ── */}
              {showQuickActions && messages.length <= 1 && (
                <div className="px-4 pb-2">
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ACTIONS.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => handleSend(a.prompt)}
                        disabled={isLoading}
                        className="px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white transition-all hover:scale-[1.02] disabled:opacity-50 bg-white/5 border border-white/10 hover:border-amber-500/30"
                      >
                        {a.icon} {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Input ── */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={voiceActive ? "Listening..." : "Ask Sophia anything..."}
                    disabled={isLoading || voiceActive}
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 transition-all"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="px-4 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 disabled:opacity-50 transition-all hover:scale-105 disabled:hover:scale-100"
                  >
                    ✧
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Sophia can search docs, query the chain, mint NFTs, troubleshoot, and more
                </p>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Button ── */}
      <motion.button
        onClick={handleToggle}
        className="relative w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-2xl bg-gradient-to-br from-amber-400 to-orange-500"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{ boxShadow: "0 0 30px rgba(255, 215, 0, 0.3)" }}
      >
        <span className="relative z-10 text-gray-900 font-bold">{isOpen ? "✕" : "✧"}</span>
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: "2px solid rgba(255,215,0,0.4)" }}
          animate={{ boxShadow: ["0 0 20px rgba(255,215,0,0.3)", "0 0 40px rgba(255,215,0,0.5)", "0 0 20px rgba(255,215,0,0.3)"] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.2); border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,215,0,0.4); }
      `}</style>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MARKDOWN RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

function renderMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  return text.split("\n").map((line, i) => {
    if (line.startsWith("### ")) return <h4 key={i} className="text-sm font-bold text-amber-400 mt-3 mb-1">{processInline(line.slice(4))}</h4>;
    if (line.startsWith("## ")) return <h3 key={i} className="text-base font-bold text-amber-400 mt-3 mb-1">{processInline(line.slice(3))}</h3>;
    if (line.startsWith("- ") || line.startsWith("* ")) return <p key={i} className="pl-3 my-0.5">{processInline("• " + line.slice(2))}</p>;
    if (line.match(/^[•●]\s/)) return <p key={i} className="pl-3 my-0.5">{processInline(line)}</p>;
    if (line.startsWith("✅") || line.startsWith("❌") || line.startsWith("⚠️") || line.startsWith("⏭️")) return <p key={i} className="my-1">{processInline(line)}</p>;
    if (!line.trim()) return <br key={i} />;
    return <p key={i} className="my-1">{processInline(line)}</p>;
  });
}

function processInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((cp, j) => {
      if (cp.startsWith("`") && cp.endsWith("`")) {
        return <code key={`${i}-${j}`} className="px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 text-xs font-mono">{cp.slice(1, -1)}</code>;
      }
      return <span key={`${i}-${j}`}>{cp}</span>;
    });
  });
}

export default SophiaChat;
