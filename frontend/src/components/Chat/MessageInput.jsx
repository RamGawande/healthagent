
import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader, Mic, MicOff, Image as ImageIcon, X } from 'lucide-react'

const MessageInput = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      
      recognitionInstance.continuous = false // Stop after pause
      recognitionInstance.interimResults = true // Show results while speaking
      recognitionInstance.lang = 'en-US' // Default language
      recognitionInstance.maxAlternatives = 1
      
      
      recognitionInstance.onstart = () => {
        console.log('Speech recognition started')
        setIsListening(true)
      }
      
      recognitionInstance.onresult = (event) => {
        console.log('Speech recognition result:', event)
        
        // Get the transcript
        let interimTranscript = ''
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }
        
        // Update message with final or interim transcript
        const currentText = finalTranscript || interimTranscript
        setMessage(currentText.trim())
        
        // Auto-resize textarea
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
          }
        }, 0)
      }
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        
        if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.')
        } else if (event.error === 'audio-capture') {
          alert('Microphone not accessible. Please check permissions.')
        } else if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please enable it in browser settings.')
        }
      }
      
      recognitionInstance.onend = () => {
        console.log('Speech recognition ended')
        setIsListening(false)
      }
      
      setRecognition(recognitionInstance)
    } else {
      console.warn('Speech recognition not supported')
    }
    
    // Cleanup
    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if ((message.trim() || selectedImage) && !disabled) {
      onSend(message, selectedImage)
      setMessage('')
      removeImage()
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleChange = (e) => {
    setMessage(e.target.value)
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.')
      return
    }

    if (isListening) {
      console.log('Stopping speech recognition')
      recognition.stop()
      setIsListening(false)
    } else {
      console.log('Starting speech recognition')
      try {
        recognition.start()
      } catch (error) {
        console.error('Error starting recognition:', error)
        setIsListening(false)
      }
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB')
        return
      }
      
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`message-input-container ${imagePreview ? 'has-image-preview' : ''}`}>
      <form onSubmit={handleSubmit} className="message-input-form">
        {/* Inline image preview - compact, same row as input */}
        {imagePreview && (
          <div className="image-preview-wrap">
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
              <button
                type="button"
                className="remove-image-btn"
                onClick={removeImage}
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about symptoms, treatments..."
          disabled={disabled}
          rows={1}
        />
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        
        {/* Image Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="image-button"
          disabled={disabled || isListening}
          title="Upload image"
        >
          <ImageIcon size={20} />
        </button>
        
        {/* Voice Input Button */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`voice-button ${isListening ? 'listening' : ''}`}
          disabled={disabled}
          title={isListening ? 'Stop recording' : 'Voice input'}
        >
          {isListening ? (
            <MicOff size={20} className="pulse" />
          ) : (
            <Mic size={20} />
          )}
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={disabled || (!message.trim() && !selectedImage)}
          className="send-button"
        >
          {disabled ? (
            <Loader size={20} className="spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
      <p className="input-hint">
        {isListening ? (
          <span className="listening-text">🎤 Listening... Speak now</span>
        ) : (
          'Press Enter to send, Shift + Enter for new line'
        )}
      </p>
    </div>
  )
}

export default MessageInput
