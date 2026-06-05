import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const userData = await authAPI.getCurrentUser()
          setUser(userData)
        } catch (error) {
          // Only log error, don't redirect - allow guest access
          console.error('Failed to fetch user:', error)
          // Only clear token if it's truly invalid (not network error)
          if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        }
      }
      // Always set loading to false, even if there's no token
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials) => {
    const data = await authAPI.login(credentials)
    localStorage.setItem('token', data.access_token)
    const userData = await authAPI.getCurrentUser()
    setUser(userData)
    return userData
  }

  const signup = async (userData) => {
    const data = await authAPI.signup(userData)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
