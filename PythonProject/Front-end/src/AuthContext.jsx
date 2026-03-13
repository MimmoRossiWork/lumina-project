import React, { createContext, useEffect, useState } from 'react'

export const AuthContext = createContext({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  logout: () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      if (typeof window === 'undefined') return null
      const raw = localStorage.getItem('lumina_user')
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    try {
      if (user) localStorage.setItem('lumina_user', JSON.stringify(user))
      else localStorage.removeItem('lumina_user')
    } catch (e) {
      // ignore
    }
  }, [user])

  const logout = () => setUser(null)

  const completeQuestionnaire = (scores) => {
    setUser((prevUser) => {
      if (!prevUser) return null
      const updatedUser = {
        ...prevUser,
        questionnaireCompleted: true,
        ...(scores || {}),
      }
      localStorage.setItem('lumina_user', JSON.stringify(updatedUser))
      return updatedUser
    })
  }

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated: !!user, logout, completeQuestionnaire }}>
      {children}
    </AuthContext.Provider>
  )
}
