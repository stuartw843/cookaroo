import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { SpaceSelector } from '../collaboration/SpaceSelector'
import { ChefHat, LogOut, User, Calendar, BookOpen, Settings, ChevronDown } from 'lucide-react'

interface HeaderProps {
  currentView: 'recipes' | 'mealplanner' | 'settings'
  onViewChange: (view: 'recipes' | 'mealplanner' | 'settings') => void
  onManageSpace: () => void
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, onManageSpace }) => {
  const { user, signOut } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Logo */}
          <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-orange-600" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 hidden xs:block">Cookaroo</h1>
          </div>
          
          {/* Center Section - Space Selector and Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 justify-center min-w-0">
            {/* Space Selector */}
            <div className="w-32 sm:w-48 flex-shrink-0">
              <SpaceSelector onManageSpace={onManageSpace} />
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-2">
                <Button
                  variant={currentView === 'recipes' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('recipes')}
                  className="flex items-center space-x-2 whitespace-nowrap"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">Recipes</span>
                </Button>

                <Button
                  variant={currentView === 'mealplanner' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('mealplanner')}
                  className="flex items-center space-x-2 whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Meal Planner</span>
                </Button>
              </div>

              {/* Tablet Navigation - Icons with text */}
              <div className="hidden md:flex lg:hidden items-center space-x-1">
                <Button
                  variant={currentView === 'recipes' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('recipes')}
                  className="flex items-center space-x-1"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs">Recipes</span>
                </Button>

                <Button
                  variant={currentView === 'mealplanner' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('mealplanner')}
                  className="flex items-center space-x-1"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Planner</span>
                </Button>
              </div>

              {/* Mobile Navigation - Icons only */}
              <div className="flex md:hidden items-center space-x-1">
                <Button
                  variant={currentView === 'recipes' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('recipes')}
                  className="p-2"
                >
                  <BookOpen className="w-4 h-4" />
                </Button>

                <Button
                  variant={currentView === 'mealplanner' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('mealplanner')}
                  className="p-2"
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Right Section - User Menu */}
          <div className="flex items-center justify-end flex-shrink-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center space-x-1 sm:space-x-2 transition-all duration-200 ${
                  userMenuOpen ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <User className="w-4 h-4" />
                <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${
                  userMenuOpen ? 'rotate-180' : ''
                }`} />
              </Button>

              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 sm:w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">Signed in as</p>
                      <p className="text-sm text-gray-600 truncate mt-1">{user?.email}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        onViewChange('settings')
                        setUserMenuOpen(false)
                      }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-150 ${
                        currentView === 'settings' ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          signOut()
                          setUserMenuOpen(false)
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors duration-150"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}