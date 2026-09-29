/**
 * The invitation that follows claiming a QOR ID: a notification wrapped in a
 * neochrome halo that turns and breathes, asking to be clicked. Clicking it
 * opens the tutorial. Still for anyone who asked for less motion.
 */

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

import './ceremony.css';

/* ─────────────────────────── the invitation ─────────────────────────── */

export function AwakenNotice({ name, onOpen }: { name: string; onOpen: () => void }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={onOpen}
      data-awaken
      className="neochrome pointer-events-auto flex max-w-[360px] items-center gap-3.5 rounded-2xl py-3.5 pl-4 pr-5 text-left"
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent/20 text-accent-bright">
        <Sparkles size={17} />
      </span>
      <span>
        <span className="block text-ui font-semibold text-ink">The Nexus is calling, {name}</span>
        <span className="block text-caption text-ink-muted">Click to begin your awakening</span>
      </span>
    </motion.button>
  );
}
