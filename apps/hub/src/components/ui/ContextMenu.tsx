'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============ Types ============

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: ContextMenuPosition | null;
  isOpen: boolean;
  onClose: () => void;
}

// ============ Component ============

export function ContextMenu({ items, position, isOpen, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Delay to prevent immediate close
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Calculate position to keep menu in viewport
  const getAdjustedPosition = useCallback(() => {
    if (!position || !menuRef.current) return { x: 0, y: 0 };

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    // Adjust if overflowing right
    if (x + rect.width > viewportWidth - 16) {
      x = viewportWidth - rect.width - 16;
    }

    // Adjust if overflowing bottom
    if (y + rect.height > viewportHeight - 16) {
      y = viewportHeight - rect.height - 16;
    }

    // Ensure minimum spacing from edges
    x = Math.max(16, x);
    y = Math.max(16, y);

    return { x, y };
  }, [position]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    item.onClick();
    onClose();
  };

  // Filter out items that are just dividers when consecutive
  const filteredItems = items.filter((item, i, arr) => {
    if (item.divider && i === 0) return false; // No divider at start
    if (item.divider && i === arr.length - 1) return false; // No divider at end
    if (item.divider && arr[i - 1]?.divider) return false; // No consecutive dividers
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && position && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] md:bg-transparent bg-black/20"
            onClick={onClose}
          />

          {/* Menu */}
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-[101] min-w-[180px] max-w-[280px] py-2 rounded-xl overflow-hidden
              bg-void-surface/95 backdrop-blur-glass
              border border-white/[0.08]"
            style={{
              left: getAdjustedPosition().x,
              top: getAdjustedPosition().y,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 229, 255, 0.08)',
            }}
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-neon-cyan/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-neon-cyan/40" />

            {filteredItems.map((item, index) => {
              if (item.divider) {
                return (
                  <div
                    key={`divider-${index}`}
                    className="my-1 mx-2 h-px bg-white/[0.08]"
                  />
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-left
                    font-display text-[12px] tracking-wide
                    transition-all duration-200 group
                    ${item.disabled 
                      ? 'text-gray-600 cursor-not-allowed' 
                      : item.danger
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                        : 'text-gray-300 hover:text-neon-cyan hover:bg-white/[0.04]'
                    }
                  `}
                >
                  {item.icon && (
                    <span className={`text-base transition-transform group-hover:scale-110 ${
                      item.disabled ? 'opacity-50' : ''
                    }`}>
                      {item.icon}
                    </span>
                  )}
                  <span className="flex-1 truncate">{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ContextMenu;
