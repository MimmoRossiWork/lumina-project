import React, { createContext, useState } from 'react'

export const LanguageContext = createContext({ language: 'it', setLanguage: () => {} })

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('it') // default ITA
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

