import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGuest } from '../../context/GuestContext'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { Bot, LogIn, UserPlus } from 'lucide-react'
import './Chat.css'

const GuestChat = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { guestMessages, addGuestMessage } = useGuest()
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    // Only redirect if auth has finished loading and user exists
    if (!loading && user) {
      navigate('/chat')
    }
  }, [user, loading, navigate])

  // Debug: log messages when they change
  useEffect(() => {
    console.log('GuestChat: messages updated', messages)
    console.log('GuestChat: guestMessages from context', guestMessages)
  }, [messages, guestMessages])

  // Initialize messages from guest context on mount
  useEffect(() => {
    if (guestMessages.length > 0 && messages.length === 0) {
      setMessages(guestMessages)
    }
  }, [])

  // Skip loading screen for guest mode - show content immediately
  if (loading) {
    return null
  }

  const handleSendMessage = async (content, imageFile = null) => {
    if (!content.trim()) return

    setSending(true)

    // Create user message
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: content,
      created_at: new Date().toISOString(),
    }

    console.log('Sending user message:', userMessage)

    // Update local state immediately
    setMessages(prev => {
      const newMessages = [...prev, userMessage]
      console.log('Updated messages with user message:', newMessages)
      return newMessages
    })
    
    // Add to guest context
    addGuestMessage(userMessage)

    // Add typing indicator
    const assistantMessageId = Date.now() + 1
    const typingIndicatorMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      streaming: true,
      isTyping: true
    }
    setMessages(prev => {
      const newMessages = [...prev, typingIndicatorMessage]
      console.log('Updated messages with typing indicator:', newMessages)
      return newMessages
    })
    addGuestMessage(typingIndicatorMessage)

    try {
      const response = await fetch('http://localhost:8009/api/guest/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.done) {
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, streaming: false }
                    : msg
                ))
                addGuestMessage({
                  id: assistantMessageId,
                  role: 'assistant',
                  content: fullResponse,
                  created_at: new Date().toISOString(),
                  streaming: false
                })
              } else if (data.token) {
                fullResponse += data.token
                setMessages(prev => {
                  const existingMessage = prev.find(msg => msg.id === assistantMessageId)
                  if (existingMessage) {
                    return prev.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: fullResponse, streaming: true, isTyping: false }
                        : msg
                    )
                  } else {
                    return [...prev, {
                      id: assistantMessageId,
                      role: 'assistant',
                      content: fullResponse,
                      created_at: new Date().toISOString(),
                      streaming: true,
                      isTyping: false
                    }]
                  }
                })
              }
            } catch (e) {
              console.warn('Invalid JSON:', line)
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => {
        const existingMessage = prev.find(msg => msg.id === assistantMessageId)
        if (existingMessage) {
          return prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content || 'Error: Failed to connect. Please try again.', streaming: false }
              : msg
          )
        } else {
          return [...prev, {
            id: assistantMessageId,
            role: 'assistant',
            content: 'Error: Failed to connect. Please try again.',
            created_at: new Date().toISOString(),
            streaming: false
          }]
        }
      })
    }

    setSending(false)
  }

  return (
    <div className="guest-chat-wrapper">
      {/* Guest Header - matches authenticated chat header */}
      <div className="chat-header guest-chat-header">
        <div className="chat-title">
          <Bot size={24} strokeWidth={1.5} />
          <div>
            <h2>Medical Assistant</h2>
            <p className="guest-subtitle">Guest Mode - No login required</p>
          </div>
        </div>
        <div className="guest-header-actions">
          <button
            className="guest-header-btn"
            onClick={() => navigate('/login')}
          >
            <LogIn size={18} />
            <span>Login</span>
          </button>
          <button
            className="guest-header-btn primary"
            onClick={() => navigate('/signup')}
          >
            <UserPlus size={18} />
            <span>Sign Up</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <Bot size={64} strokeWidth={1.5} />
            <h3>Medical Assistant</h3>
            <p>Ask me anything about symptoms, treatments, or medical advice</p>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>

      {/* Input */}
      <div className="message-input-container">
        <MessageInput onSend={handleSendMessage} disabled={sending} />
      </div>
    </div>
  )
}

export default GuestChat
