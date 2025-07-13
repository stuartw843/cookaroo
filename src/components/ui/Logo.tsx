import React from 'react'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  alt?: string
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', alt = 'Cookaroo logo' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        role="img"
        aria-label={alt}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <title>{alt}</title>
        {/* Background Circle with Gradient */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="100%" stopColor="#F7931E" />
          </linearGradient>
          <linearGradient id="spoonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8F9FA" />
          </linearGradient>
          <linearGradient id="forkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8F9FA" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000020"/>
          </filter>
        </defs>
        
        {/* Main Circle Background */}
        <circle
          cx="60"
          cy="60"
          r="55"
          fill="url(#bgGradient)"
          filter="url(#shadow)"
        />
        
        {/* Inner Circle for Depth */}
        <circle
          cx="60"
          cy="60"
          r="48"
          fill="none"
          stroke="#FFFFFF20"
          strokeWidth="1"
        />
        
        {/* Spoon */}
        <g transform="translate(35, 25)">
          {/* Spoon Bowl */}
          <ellipse
            cx="15"
            cy="15"
            rx="12"
            ry="8"
            fill="url(#spoonGradient)"
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
          {/* Spoon Handle */}
          <rect
            x="13"
            y="20"
            width="4"
            height="35"
            rx="2"
            fill="url(#spoonGradient)"
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
          {/* Spoon Handle End */}
          <circle
            cx="15"
            cy="57"
            r="3"
            fill="url(#spoonGradient)"
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
        </g>
        
        {/* Fork */}
        <g transform="translate(70, 25)">
          {/* Fork Tines */}
          <rect x="10" y="10" width="2" height="15" rx="1" fill="url(#forkGradient)" stroke="#E5E7EB" strokeWidth="0.3"/>
          <rect x="13" y="10" width="2" height="15" rx="1" fill="url(#forkGradient)" stroke="#E5E7EB" strokeWidth="0.3"/>
          <rect x="16" y="10" width="2" height="15" rx="1" fill="url(#forkGradient)" stroke="#E5E7EB" strokeWidth="0.3"/>
          <rect x="19" y="10" width="2" height="15" rx="1" fill="url(#forkGradient)" stroke="#E5E7EB" strokeWidth="0.3"/>
          
          {/* Fork Base */}
          <rect
            x="9"
            y="22"
            width="13"
            height="4"
            rx="2"
            fill="url(#forkGradient)"
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
          
          {/* Fork Handle */}
          <rect
            x="13.5"
            y="24"
            width="4"
            height="31"
            rx="2"
            fill="url(#forkGradient)"
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
          
          {/* Fork Handle End */}
          <circle
            cx="15.5"
            cy="57"
            r="3"
            fill="url(#forkGradient)"
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
        </g>
        
        {/* Stylized "C" in the center */}
        <path
          d="M60 75C52 75 45 82 45 90C45 98 52 105 60 105C64 105 67.5 103.5 70 101L67 98C65.5 99.5 63 100.5 60 100.5C54.5 100.5 49.5 95.5 49.5 90C49.5 84.5 54.5 79.5 60 79.5C63 79.5 65.5 80.5 67 82L70 79C67.5 76.5 64 75 60 75Z"
          fill="#FFFFFF"
          stroke="#E5E7EB"
          strokeWidth="0.5"
        />
        
        {/* Collaboration Dots - representing sharing/community */}
        <circle cx="25" cy="95" r="3" fill="#FFFFFF80" />
        <circle cx="35" cy="100" r="2.5" fill="#FFFFFF60" />
        <circle cx="85" cy="100" r="2.5" fill="#FFFFFF60" />
        <circle cx="95" cy="95" r="3" fill="#FFFFFF80" />
        
        {/* Connecting Lines - subtle collaboration indicator */}
        <path
          d="M28 95 Q45 85 60 90 Q75 85 92 95"
          stroke="#FFFFFF40"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
