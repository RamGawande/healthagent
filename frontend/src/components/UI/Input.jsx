import React, { forwardRef } from 'react'

const Input = forwardRef(({
  type = 'text',
  label,
  error,
  helperText,
  icon: Icon,
  leftElement,
  rightElement,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const wrapperClasses = `
    input-wrapper
    ${error ? 'has-error' : ''}
    ${className}
  `.trim()

  return (
    <div className={wrapperClasses} style={{ marginBottom: '1rem', width: '100%' }}>
      {label && (
        <label 
          htmlFor={props.id} 
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-sm)'
          }}
        >
          {label}
        </label>
      )}
      
      <div className="input-icon-wrapper" style={{ position: 'relative' }}>
        {Icon && (
          <span 
            className="input-icon"
            style={{
              position: 'absolute',
              left: 'var(--space-3)',
              color: 'var(--text-tertiary)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Icon size={20} />
          </span>
        )}
        {leftElement && (
          <span style={{
            position: 'absolute',
            left: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center'
          }}>
            {leftElement}
          </span>
        )}
        
        <input
          type={type}
          ref={ref}
          className={`input ${Icon || leftElement ? 'input-with-icon' : ''} ${error ? 'input-error' : ''}`}
          disabled={disabled}
          style={{ paddingLeft: Icon || leftElement ? '2.75rem' : 'var(--space-4)' }}
          {...props}
        />
        
        {rightElement && (
          <span style={{
            position: 'absolute',
            right: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center'
          }}>
            {rightElement}
          </span>
        )}
      </div>
      
      {(error || helperText) && (
        <p style={{
          marginTop: '0.5rem',
          fontSize: 'var(--font-size-sm)',
          color: error ? 'var(--error-500)' : 'var(--text-tertiary)'
        }}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
