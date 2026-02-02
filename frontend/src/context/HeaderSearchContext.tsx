import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react'

export interface HeaderSearchContextType {
  searchSlot: ReactNode | null
  setSearchSlot: (slot: ReactNode | null) => void
}

const HeaderSearchContext = createContext<HeaderSearchContextType | null>(null)

export const HeaderSearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchSlot, setSearchSlot] = useState<ReactNode | null>(null)

  const value = useMemo<HeaderSearchContextType>(() => ({
    searchSlot,
    setSearchSlot,
  }), [searchSlot])

  return (
    <HeaderSearchContext.Provider value={value}>
      {children}
    </HeaderSearchContext.Provider>
  )
}

export const useHeaderSearch = () => {
  const ctx = useContext(HeaderSearchContext)
  if (!ctx) {
    throw new Error('useHeaderSearch must be used within a HeaderSearchProvider')
  }
  return ctx
}

