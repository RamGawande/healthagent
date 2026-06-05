import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'

// Toast notification component with custom styling
const ToastNotification = ({ t, message, type = 'default', icon: CustomIcon }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
    default: null,
  }

  const colors = {
    success: {
      bg: 'var(--success-50)',
      border: 'var(--success-500)',
      text: 'var(--success-600)',
      icon: 'var(--success-500)',
    },
    error: {
      bg: 'var(--error-50)',
      border: 'var(--error-500)',
      text: 'var(--error-600)',
      icon: 'var(--error-500)',
    },
    warning: {
      bg: 'var(--warning-50)',
      border: 'var(--warning-500)',
      text: 'var(--warning-600)',
      icon: 'var(--warning-500)',
    },
    info: {
      bg: 'var(--info-50)',
      border: 'var(--info-500)',
      text: 'var(--info-600)',
      icon: 'var(--info-500)',
    },
    default: {
      bg: 'var(--bg-primary)',
      border: 'var(--border-light)',
      text: 'var(--text-primary)',
      icon: 'var(--text-secondary)',
    },
  }

  const Icon = CustomIcon || icons[type]
  const color = colors[type] || colors.default

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      style={{
        backgroundColor: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        boxShadow: 'var(--shadow-lg)',
        minWidth: '300px',
        maxWidth: '400px',
      }}
    >
      {Icon && (
        <Icon
          size={20}
          style={{ color: color.icon, flexShrink: 0 }}
        />
      )}
      <p style={{
        color: color.text,
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        margin: 0,
        flex: 1,
      }}>
        {message}
      </p>
      <button
        onClick={() => toast.dismiss(t.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 'var(--space-1)',
          color: color.text,
          opacity: 0.6,
          transition: 'opacity var(--transition-fast)',
        }}
        onMouseEnter={(e) => e.target.style.opacity = 1}
        onMouseLeave={(e) => e.target.style.opacity = 0.6}
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}

// Custom Toast Provider Component
const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
        },
      }}
      containerStyle={{
        zIndex: 'var(--z-toast)',
      }}
    >
      {(t) => (
        <ToastNotification
          t={t}
          message={t.message}
          type={t.type || 'default'}
          icon={t.icon}
        />
      )}
    </Toaster>
  )
}

// Export toast helpers for easy usage
export const showToast = {
  success: (message, options = {}) => toast.success(message, {
    type: 'success',
    ...options,
  }),
  error: (message, options = {}) => toast.error(message, {
    type: 'error',
    ...options,
  }),
  warning: (message, options = {}) => toast.custom((t) => (
    <ToastNotification t={t} message={message} type="warning" />
  ), {
    duration: 4000,
    ...options,
  }),
  info: (message, options = {}) => toast.custom((t) => (
    <ToastNotification t={t} message={message} type="info" />
  ), {
    duration: 4000,
    ...options,
  }),
  custom: (message, options = {}) => toast.custom((t) => (
    <ToastNotification t={t} message={message} type="default" />
  ), {
    duration: 4000,
    ...options,
  }),
  promise: (promise, options = {}) => toast.promise(promise, {
    loading: options.loading || 'Loading...',
    success: options.success || 'Success!',
    error: options.error || 'Error!',
  }),
}

export default ToastProvider
