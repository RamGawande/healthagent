
import React, { useEffect, useRef, useState } from 'react'
import { User, Bot, Volume2, VolumeX } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'

const MessageList = ({ messages }) => {
  const messagesEndRef = useRef(null)
  const [speakingMessageId, setSpeakingMessageId] = useState(null)
  const [speechSynthesis, setSpeechSynthesis] = useState(null)
  const [voices, setVoices] = useState([])

    useEffect(() => {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)
      }
      
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSpeechSynthesis(window.speechSynthesis)
    }

    // Cleanup: stop speech when component unmounts
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), 'h:mm a')
    } catch {
      return ''
    }
  }

  const detectLanguage = (text) => {
    // Simple language detection based on character ranges
    const hindiRegex = /[\u0900-\u097F]/
    const arabicRegex = /[\u0600-\u06FF]/
    const chineseRegex = /[\u4E00-\u9FFF]/
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/
    const marathiRegex = /[\u0900-\u097F]/
    const marathiWords = ['आहे', 'होते', 'करा', 'काय', 'कसे', 'येथे', 'तुम्ही', 'मी', 'आपण']
    const hasMarathiWords = marathiWords.some(word => text.includes(word))
  
    if (hasMarathiWords) return 'mr-IN'  // Marathi
    if (hindiRegex.test(text)) return 'hi-IN'
    if (arabicRegex.test(text)) return 'ar-SA'
    if (chineseRegex.test(text)) return 'zh-CN'
    if (japaneseRegex.test(text)) return 'ja-JP'
    
    return 'en-US' // Default to English
  }

  const speakText = (text, messageId) => {
    if (!speechSynthesis) {
      alert('Text-to-speech is not supported in your browser.')
      return
    }

    // If already speaking this message, stop it
    if (speakingMessageId === messageId) {
      speechSynthesis.cancel()
      setSpeakingMessageId(null)
      return
    }

    // Stop any ongoing speech
    speechSynthesis.cancel()

    // Remove markdown formatting for better speech
    const cleanText = text
      .replace(/[#*_~`]/g, '') // Remove markdown symbols
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to just text
      .replace(/\n+/g, '. ') // Convert newlines to pauses

    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(cleanText)
    
    // Detect and set language
    const detectedLang = detectLanguage(text)
    utterance.lang = detectedLang
    
    // Speech settings
    utterance.rate =  // Slightly slower for clarity
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Try to find appropriate voice for the language
    const voices = speechSynthesis.getVoices()
    const voice = voices.find(v => v.lang.startsWith(detectedLang.split('-')[0]))
    if (voice) {
      utterance.voice = voice
    }

    // Event handlers
    utterance.onstart = () => {
      setSpeakingMessageId(messageId)
    }

    utterance.onend = () => {
      setSpeakingMessageId(null)
    }

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error)
      setSpeakingMessageId(null)
    }

    // Speak the text
    speechSynthesis.speak(utterance)
  }

  if (messages.length === 0) {
    return (
      <div className="messages-container empty">
        <div className="empty-messages">
          <Bot size={48} strokeWidth={1.5} />
          <h3>Start a conversation</h3>
          <p>Ask me anything about medical conditions, symptoms, or book an appointment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="messages-container">
      <div className="messages-list">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            <div className="message-avatar">
              {message.role === 'user' ? (
                <User size={20} />
              ) : (
                <Bot size={20} />
              )}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-role">
                  {message.role === 'user' ? 'You' : 'Medical Assistant'}
                </span>
                <span className="message-time">
                  {formatTime(message.created_at)}
                </span>
              </div>
              <div className="message-text">
                {message.role === 'assistant' ? (
                  <>
                    {message.isTyping && !message.content ? (
                      <div className="typing-indicator">
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                      </div>
                    ) : message.content ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      <span className="thinking-text">Thinking...</span>
                    )}
                    {message.streaming && !message.isTyping && message.content && <span className="typing-cursor">▊</span>}
                    
                    {/* Speaker Icon - Only show when NOT streaming */}
                    {!message.streaming && message.content && (
                      <button
                        className={`speaker-button ${speakingMessageId === message.id ? 'speaking' : ''}`}
                        onClick={() => speakText(message.content, message.id)}
                        title={speakingMessageId === message.id ? 'Stop speaking' : 'Read aloud'}
                      >
                        {speakingMessageId === message.id ? (
                          <VolumeX size={16} className="pulse-icon" />
                        ) : (
                          <Volume2 size={16} />
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {/* Display image if present in message */}
                    {message.imageUrl && (
                      <div className="message-image">
                        <img src={message.imageUrl} alt="Uploaded" />
                      </div>
                    )}
                    <p>{message.content?.replace(/\[Image:.*?\]/g, '').trim() || message.content}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default MessageList
