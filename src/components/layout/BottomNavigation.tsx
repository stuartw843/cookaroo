import React from 'react'
import { BookOpen, Calendar, Settings, User } from 'lucide-react'

interface BottomNavigationProps {
  currentView: 'recipes' | 'mealplanner' | 'settings'
  onViewChange: (view: 'recipes' | 'mealplanner' | 'settings') => void
  onUserMenuToggle: () => void
  userMenuOpen: boolean
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentView,
  onViewChange,
  onUserMenuToggle,
  userMenuOpen
}) => {
  const navItems = [
    {
      key: 'recipes' as const,
      label: 'Recipes',
      icon: BookOpen,
      active: currentView === 'recipes'
    },
    {
      key: 'mealplanner' as const,
      label: 'Planner',
      icon: Calendar,
      active: currentView === 'mealplanner'
    },
    {
      key: 'settings' as const,
      label: 'Settings',
      icon: Settings,
      active: currentView === 'settings'
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] min-h-[52px] ${
                item.active
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${item.active ? 'text-orange-600' : 'text-current'}`} />
              <span className={`text-xs font-medium ${item.active ? 'text-orange-600' : 'text-current'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
        
        {/* User Menu Button */}
        <button
          onClick={onUserMenuToggle}
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] min-h-[52px] ${
            userMenuOpen
              ? 'bg-gray-100 text-gray-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100'
          }`}
        >
          <User className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
    </div>
  )
}
