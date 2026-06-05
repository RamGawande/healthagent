import axios from 'axios'

// Use environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8009'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not already on guest or auth pages
      const currentPath = window.location.pathname
      if (!currentPath.startsWith('/login') &&
          !currentPath.startsWith('/signup') &&
          !currentPath.startsWith('/try') &&
          currentPath !== '/') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const formData = new URLSearchParams()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)
    
    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  },
  
  signup: async (userData) => {
    const response = await api.post('/api/auth/signup', userData)
    return response.data
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },
}

// Session API
export const sessionAPI = {
  createSession: async (title = 'New Chat') => {
    const response = await api.post('/api/sessions/', { title })
    return response.data
  },
  
  getSessions: async () => {
    const response = await api.get('/api/sessions/')
    return response.data
  },
  
  getSession: async (sessionId) => {
    const response = await api.get(`/api/sessions/${sessionId}`)
    return response.data
  },
  
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/api/sessions/${sessionId}`)
    return response.data
  },
  
  updateSessionTitle: async (sessionId, title) => {
    const response = await api.patch(`/api/sessions/${sessionId}/title`, null, {
      params: { title }
    })
    return response.data
  },
}

// Chat API
// export const chatAPI = {
//   sendMessage: async (sessionId, content) => {
//     const response = await api.post(`/api/chat/${sessionId}/message`, {
//       content,
//       role: 'user'
//     })
//     return response.data
//   },
  
//   getMessages: async (sessionId) => {
//     const response = await api.get(`/api/chat/${sessionId}/messages`)
//     return response.data
//   },
// }
// Add this new function to chatAPI //////////////////////////////,,,,,,,,,,,,,ldjc ddddddddkljjvlkkkkkkkkkkkkkkkddddddddddddddddd
// export const chatAPI = {
//   sendMessage: async (sessionId, content) => {
//     const response = await api.post(`/api/chat/${sessionId}/message`, {
//       content,
//       role: 'user'
//     })
//     return response.data
//   },
  
//   // NEW: Streaming message function
//   streamMessage: (sessionId, content, onToken, onComplete, onError) => {
//     const token = localStorage.getItem('token')
//     const url = `${API_BASE_URL}/api/chat/${sessionId}/stream`
    
//     const eventSource = new EventSource(url)
    
//     // Send the message first via POST
//     fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`
//       },
//       body: JSON.stringify({ content, role: 'user' })
//     }).then(() => {
//       // Now listen for streaming response
//       const streamUrl = `${API_BASE_URL}/api/chat/${sessionId}/stream?message=${encodeURIComponent(content)}`
//       const es = new EventSource(streamUrl)
      
//       es.onmessage = (event) => {
//         const data = JSON.parse(event.data)
        
//         if (data.error) {
//           onError(data.token)
//           es.close()
//         } else if (data.done) {
//           onComplete()
//           es.close()
//         } else {
//           onToken(data.token)
//         }
//       }
      
//       es.onerror = () => {
//         onError('Connection error')
//         es.close()
//       }
      
//       return es
//     })
//   },
  
//   getMessages: async (sessionId) => {
//     const response = await api.get(`/api/chat/${sessionId}/messages`)
//     return response.data
//   },
// }
export const chatAPI = {
  sendMessage: async (sessionId, content) => {
    const response = await api.post(`/api/chat/${sessionId}/message`, {
      content,
      role: 'user'
    })
    return response.data
  },
  
  // FIXED: Streaming with proper POST request
  streamMessage: async (sessionId, content, imageFile, onToken, onComplete, onError) => {
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('content', content)
      
      if (imageFile) {
        formData.append('image', imageFile)
      }
      
      // Make POST request with streaming response
      const response = await fetch(`${API_BASE_URL}/api/chat/${sessionId}/stream`, {
        method: 'POST',  // ✅ Must be POST
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type - browser sets it automatically for FormData
        },
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Read the streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                onError(data.token)
                return
              } else if (data.done) {
                onComplete()
                return
              } else {
                onToken(data.token)
              }
            } catch (e) {
              // Skip invalid JSON
              console.warn('Invalid JSON in stream:', line)
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      onError(error.message)
    }
  },
  
  getMessages: async (sessionId) => {
    const response = await api.get(`/api/chat/${sessionId}/messages`)
    return response.data
  },
}


// Admin API
export const adminAPI = {
  uploadDocument: async (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/api/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        if (onProgress) onProgress(percentCompleted)
      },
    })
    return response.data
  },
  
  getDocuments: async () => {
    const response = await api.get('/api/admin/documents')
    return response.data
  },
  
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/api/admin/documents/${documentId}`)
    return response.data
  },
}

export default api
