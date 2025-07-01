import React from 'react'

interface BoltBadgeProps {
  variant?: 'white-circle' | 'black-circle' | 'powered-by'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | 'static'
}

export const BoltBadge: React.FC<BoltBadgeProps> = ({ 
  variant = 'black-circle', 
  size = 'md',
  className = '',
  position = 'top-right'
}) => {
  // Size configurations
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  
  const poweredBySizeClasses = {
    sm: 'h-6',
    md: 'h-8', 
    lg: 'h-10'
  }
  
  // Position configurations
  const positionClasses = {
    'top-right': 'fixed top-20 right-4 z-40',
    'bottom-right': 'fixed bottom-4 right-4 z-40',
    'top-left': 'fixed top-20 left-4 z-40',
    'bottom-left': 'fixed bottom-4 left-4 z-40',
    'static': ''
  }
  
  // Badge source mapping
  const badgeSources = {
    'white-circle': '/bolt-badge/white-circle.svg',
    'black-circle': '/bolt-badge/black-circle.svg',
    'powered-by': '/bolt-badge/powered-by-bolt.svg'
  }
  
  // Determine appropriate size class
  const sizeClass = variant === 'powered-by' 
    ? poweredBySizeClasses[size] 
    : sizeClasses[size]
  
  return (
    <a
      href="https://bolt.new/"
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-block transition-all duration-200 hover:scale-105 hover:opacity-90
        ${position !== 'static' ? positionClasses[position] : ''}
        ${className}
      `}
      title="Built with Bolt.new"
    >
      <img
        src={badgeSources[variant]}
        alt="Built with Bolt.new"
        className={`
          ${sizeClass}
          ${variant === 'powered-by' ? 'w-auto' : ''}
          drop-shadow-sm hover:drop-shadow-md transition-all duration-200
        `}
      />
    </a>
  )
}
