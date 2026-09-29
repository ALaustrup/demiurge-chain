'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SophiaContextType {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
}

const SophiaContext = createContext<SophiaContextType>({
  isOpen: false,
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
})

export function SophiaProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <SophiaContext.Provider
      value={{
        isOpen,
        openChat: () => setIsOpen(true),
        closeChat: () => setIsOpen(false),
        toggleChat: () => setIsOpen(!isOpen),
      }}
    >
      {children}
    </SophiaContext.Provider>
  )
}

export function useSophia() {
  return useContext(SophiaContext)
}
