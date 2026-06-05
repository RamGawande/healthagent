import React from 'react'
import { motion } from 'framer-motion'

const Card = ({
  children,
  className = '',
  hoverable = false,
  bordered = false,
  padding = true,
  onClick,
  ...props
}) => {
  const classes = `
    card
    ${hoverable ? 'card-hoverable' : ''}
    ${bordered ? 'card-bordered' : ''}
    ${padding ? 'card-padding' : ''}
    ${className}
  `.trim()

  if (onClick) {
    return (
      <motion.div
        className={classes}
        onClick={onClick}
        whileHover={{ y: -4, boxShadow: 'var(--shadow-xl)' }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export default Card
