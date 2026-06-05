import React, { useState, useEffect } from 'react'
import { Users, Search, Shield, ShieldOff, UserCheck, UserX, MessageSquare, Calendar, Eye } from 'lucide-react'
import axios from 'axios'
import './Admin.css'
import './UserManagement.css'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userSessions, setUserSessions] = useState([])
  const [sessionMessages, setSessionMessages] = useState([])
  const [viewingSession, setViewingSession] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async (search = '') => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const url = search 
        ? `http://localhost:8009/api/admin/users?search=${encodeURIComponent(search)}`
        : 'http://localhost:8009/api/admin/users'
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchUsers(value)
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }

  const viewUserDetails = async (user) => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch user sessions
      const sessionsResponse = await axios.get(
        `http://localhost:8009/api/admin/users/${user.id}/sessions`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setSelectedUser(user)
      setUserSessions(sessionsResponse.data)
      setSessionMessages([])
      setViewingSession(null)
    } catch (error) {
      console.error('Error fetching user details:', error)
      alert('Failed to fetch user details')
    }
  }

  const viewSessionMessages = async (sessionId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `http://localhost:8009/api/admin/users/${selectedUser.id}/sessions/${sessionId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setSessionMessages(response.data)
      setViewingSession(sessionId)
    } catch (error) {
      console.error('Error fetching messages:', error)
      alert('Failed to fetch messages')
    }
  }

  const toggleAdmin = async (userId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.patch(
        `http://localhost:8009/api/admin/users/${userId}/toggle-admin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      fetchUsers(searchTerm)
      alert('User admin status updated')
    } catch (error) {
      console.error('Error toggling admin:', error)
      alert(error.response?.data?.detail || 'Failed to update admin status')
    }
  }

  const toggleActive = async (userId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.patch(
        `http://localhost:8009/api/admin/users/${userId}/toggle-active`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      fetchUsers(searchTerm)
      alert('User active status updated')
    } catch (error) {
      console.error('Error toggling active:', error)
      alert(error.response?.data?.detail || 'Failed to update active status')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  if (selectedUser) {
    return (
      <div className="user-management">
        <div className="user-detail-header">
          <button onClick={() => setSelectedUser(null)} className="btn-secondary">
            ← Back to Users
          </button>
          <h2>
            <Users size={24} />
            {selectedUser.username}'s Profile
          </h2>
        </div>

        <div className="user-detail-info">
          <div className="info-card">
            <h3>User Information</h3>
            <p><strong>Username:</strong> {selectedUser.username}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Status:</strong> {selectedUser.is_active ? '🟢 Active' : '🔴 Inactive'}</p>
            <p><strong>Role:</strong> {selectedUser.is_admin ? '✅ Admin' : '👤 User'}</p>
            <p><strong>Created:</strong> {formatDate(selectedUser.created_at)}</p>
            <p><strong>Last Activity:</strong> {formatDate(selectedUser.last_activity)}</p>
          </div>

          <div className="info-card">
            <h3>Statistics</h3>
            <p><strong>Total Sessions:</strong> {selectedUser.total_sessions}</p>
            <p><strong>Total Messages:</strong> {selectedUser.total_messages}</p>
          </div>
        </div>

        <div className="user-sessions">
          <h3>
            <MessageSquare size={20} />
            Chat Sessions ({userSessions.length})
          </h3>
          
          {userSessions.length === 0 ? (
            <p className="no-data">No chat sessions found</p>
          ) : (
            <div className="sessions-list">
              {userSessions.map((session) => (
                <div key={session.id} className="session-item">
                  <div className="session-info">
                    <h4>{session.title}</h4>
                    <p>Created: {formatDate(session.created_at)}</p>
                    <p>Updated: {formatDate(session.updated_at)}</p>
                  </div>
                  <button 
                    onClick={() => viewSessionMessages(session.id)}
                    className="btn-primary"
                  >
                    <Eye size={16} />
                    View Messages
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {viewingSession && (
          <div className="session-messages">
            <h3>Messages</h3>
            <div className="messages-container">
              {sessionMessages.map((message) => (
                <div 
                  key={message.id} 
                  className={`message-item ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className="message-header">
                    <strong>{message.role === 'user' ? '👤 User' : '🤖 Assistant'}</strong>
                    <span>{formatDate(message.created_at)}</span>
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>
          <Users size={24} />
          User Management
        </h2>
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Sessions</th>
                <th>Messages</th>
                <th>Last Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.is_admin ? (
                      <span className="badge badge-admin">✅ Admin</span>
                    ) : (
                      <span className="badge badge-user">👤 User</span>
                    )}
                  </td>
                  <td>
                    {user.is_active ? (
                      <span className="badge badge-active">🟢 Active</span>
                    ) : (
                      <span className="badge badge-inactive">🔴 Inactive</span>
                    )}
                  </td>
                  <td>{user.total_sessions}</td>
                  <td>{user.total_messages}</td>
                  <td>{formatDate(user.last_activity)}</td>
                  <td className="action-buttons">
                    <button
                      onClick={() => viewUserDetails(user)}
                      className="btn-icon"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => toggleAdmin(user.id)}
                      className="btn-icon"
                      title={user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    >
                      {user.is_admin ? <ShieldOff size={16} /> : <Shield size={16} />}
                    </button>
                    <button
                      onClick={() => toggleActive(user.id)}
                      className="btn-icon"
                      title={user.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="no-data">
              {searchTerm ? 'No users found matching your search' : 'No users found'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UserManagement

