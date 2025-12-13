"use client"

import { createContext, useContext, useState } from "react"

interface BaseContextType {
  // Add your base context state and methods here
}

const BaseContext = createContext<BaseContextType | undefined>(undefined)

export function BaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseContext.Provider value={{}}>
      {children}
    </BaseContext.Provider>
  )
}

export function useBase() {
  const context = useContext(BaseContext)
  if (context === undefined) {
    throw new Error("useBase must be used within a BaseProvider")
  }
  return context
}
