import React, { createContext, useState, useContext, useEffect } from 'react'

const GuestContext = createContext()

export const useGuest = () => {
  const context = useContext(GuestContext)
  if (!context) {
    throw new Error('useGuest must be used within GuestProvider')
  }
  return context
}

export const GuestProvider = ({ children }) => {
  const [guestMessages, setGuestMessages] = useState([])
  const [isGuestMode, setIsGuestMode] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (!token) {
      setIsGuestMode(true)
      // Load guest messages from localStorage
      const saved = localStorage.getItem('guest_messages')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            setGuestMessages(parsed)
          }
        } catch (e) {
          console.error('Failed to parse guest messages:', e)
        }
      }
    }
  }, [])

  const addGuestMessage = (message) => {
    setGuestMessages(prev => {
      const newMessages = [...prev, message]
      localStorage.setItem('guest_messages', JSON.stringify(newMessages))
      return newMessages
    })
  }

  const clearGuestMessages = () => {
    setGuestMessages([])
    localStorage.removeItem('guest_messages')
  }

  const getGuestMessages = () => {
    return guestMessages
  }

  return (
    <GuestContext.Provider value={{
      isGuestMode,
      guestMessages,
      addGuestMessage,
      clearGuestMessages,
      getGuestMessages,
      setIsGuestMode
    }}>
      {children}
    </GuestContext.Provider>
  )
}
