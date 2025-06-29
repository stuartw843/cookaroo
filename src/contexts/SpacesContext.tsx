import React, { createContext, useContext } from 'react'
import { useSpacesData } from '../hooks/useSpaces'

type SpacesContextType = ReturnType<typeof useSpacesData>
const SpacesContext = createContext<SpacesContextType | undefined>(undefined)

export const useSpacesContext = () => {
  const context = useContext(SpacesContext)
  if (!context) {
    throw new Error('useSpacesContext must be used within a SpacesProvider')
  }
  return context
}

// Re-export useSpaces hook to ensure we're using the context version
export const useSpaces = () => {
  return useSpacesContext()
}

export const SpacesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const spacesData = useSpacesData()
  
  // Add error boundary protection
  if (spacesData.error) {
    console.error('Spaces context error:', spacesData.error)
  }
  
  return (
    <SpacesContext.Provider value={spacesData}>
      {children}
    </SpacesContext.Provider>
  )
}