'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ContextMenu, type ContextMenuItem, type ContextMenuPosition } from '@/components/ui/ContextMenu';

// ============ Context Type ============

interface ContextMenuContextType {
  showContextMenu: (e: React.MouseEvent, items: ContextMenuItem[]) => void;
  hideContextMenu: () => void;
  isOpen: boolean;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

// ============ Provider ============

interface ContextMenuProviderProps {
  children: ReactNode;
}

export function ContextMenuProvider({ children }: ContextMenuProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition | null>(null);
  const [items, setItems] = useState<ContextMenuItem[]>([]);

  const showContextMenu = useCallback((e: React.MouseEvent, menuItems: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    
    setPosition({ x: e.clientX, y: e.clientY });
    setItems(menuItems);
    setIsOpen(true);
  }, []);

  const hideContextMenu = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setPosition(null);
      setItems([]);
    }, 150);
  }, []);

  return (
    <ContextMenuContext.Provider value={{ showContextMenu, hideContextMenu, isOpen }}>
      {children}
      <ContextMenu
        isOpen={isOpen}
        position={position}
        items={items}
        onClose={hideContextMenu}
      />
    </ContextMenuContext.Provider>
  );
}

// ============ Hook ============

export function useGlobalContextMenu() {
  const context = useContext(ContextMenuContext);
  if (context === undefined) {
    throw new Error('useGlobalContextMenu must be used within a ContextMenuProvider');
  }
  return context;
}

export default ContextMenuProvider;
