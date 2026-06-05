import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquarePlus,
  Trash2,
  LogOut,
  User,
  Shield,
  Menu,
  X,
  Heart,
  Moon,
  Sun
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const Sidebar = ({
  sessions,
  currentSession,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  collapsed,
  onToggleCollapse,
}) => {
  const { user, logout, isAdmin } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDelete = (sessionId, e) => {
    e.stopPropagation()
    if (deleteConfirm === sessionId) {
      onDeleteSession(sessionId)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(sessionId)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  if (collapsed) {
    return (
      <div className="sidebar collapsed">
        <button className="toggle-btn" onClick={onToggleCollapse}>
          <Menu size={20} />
        </button>
        <button 
          className="toggle-btn theme-toggle-mini" 
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    )
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Heart size={28} strokeWidth={2.5} />
          <span>Health Agent</span>
        </div>
        <div className="sidebar-header-actions">
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="toggle-btn" onClick={onToggleCollapse}>
            <X size={20} />
          </button>
        </div>
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        <MessageSquarePlus size={20} />
        <span>New Chat</span>
      </button>

      <div className="sessions-list">
        <h3 className="sessions-title">Recent Chats</h3>
        {sessions.length === 0 ? (
          <div className="empty-sessions">
            <p>No conversations yet</p>
            <span>Start a new chat to begin</span>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${
                currentSession?.id === session.id ? 'active' : ''
              }`}
              onClick={() => onSelectSession(session)}
            >
              <div className="session-content">
                <h4>{session.title}</h4>
                <span className="session-date">
                  {formatDate(session.updated_at)}
                </span>
              </div>
              <button
                className={`delete-btn ${
                  deleteConfirm === session.id ? 'confirm' : ''
                }`}
                onClick={(e) => handleDelete(session.id, e)}
                title={deleteConfirm === session.id ? 'Click again to confirm' : 'Delete chat'}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        {isAdmin && (
          <button
            className="footer-btn admin-btn"
            onClick={() => navigate('/admin')}
          >
            <Shield size={18} />
            <span>Admin Panel</span>
          </button>
        )}

        <div className="user-info">
          <User size={18} />
          <span>{user?.username}</span>
        </div>

        <button className="footer-btn logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
