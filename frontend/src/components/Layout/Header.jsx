import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { Heart, User, Shield, LogOut, Menu, ChevronDown, Bell, Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'
import './Layout.css'

const Header = ({ onMenuToggle }) => {
  const { user, logout, isAdmin } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle menu">
          <Menu size={24} />
        </button>
        <div 
          className="header-logo" 
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <Heart size={28} fill="var(--primary-600)" strokeWidth={2} />
          <span>Medical Assistant</span>
        </div>
      </div>

      <div className="header-right">
        {/* Theme Toggle */}
        <button 
          className="header-btn theme-toggle" 
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications - Placeholder for future feature */}
        <button className="header-btn notification-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-badge"></span>
        </button>

        {isAdmin && (
          <button
            className="header-btn admin-badge"
            onClick={() => navigate('/admin')}
            title="Admin Dashboard"
          >
            <Shield size={18} />
            <span className="desktop-only">Admin</span>
          </button>
        )}

        {/* User Dropdown */}
        <div className="user-dropdown">
          <button 
            className="user-menu"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="User menu"
            aria-expanded={dropdownOpen}
          >
            <div className="user-avatar">
              <User size={18} />
            </div>
            <span className="user-name desktop-only">{user?.username}</span>
            <ChevronDown size={16} className={`desktop-only ${dropdownOpen ? 'rotated' : ''}`} />
          </button>

          {dropdownOpen && (
            <motion.div 
              className="user-dropdown-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  <User size={24} />
                </div>
                <div>
                  <strong>{user?.username}</strong>
                  <p>{user?.email}</p>
                </div>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <button 
                className="dropdown-item"
                onClick={() => {
                  navigate('/profile')
                  setDropdownOpen(false)
                }}
              >
                <User size={18} />
                <span>Profile</span>
              </button>
              
              {isAdmin && (
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/admin')
                    setDropdownOpen(false)
                  }}
                >
                  <Shield size={18} />
                  <span>Admin Panel</span>
                </button>
              )}
              
              <div className="dropdown-divider"></div>
              
              <button 
                className="dropdown-item logout"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
