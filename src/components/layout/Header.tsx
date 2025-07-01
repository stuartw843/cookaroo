import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'
import { SpaceSelector } from '../collaboration/SpaceSelector'
import { LogOut, User, Calendar, BookOpen, Settings, ChevronDown, Menu, X } from 'lucide-react'

interface HeaderProps {
  currentView: 'recipes' | 'mealplanner' | 'settings'
  onViewChange: (view: 'recipes' | 'mealplanner' | 'settings') => void
  onManageSpace: () => void
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, onManageSpace }) => {
  const { user, signOut } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Logo */}
            <div className="flex items-center space-x-3 min-w-0 flex-shrink-0">
              <Logo size="lg" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 hidden xs:block">Cookaroo</h1>
            </div>
            
            {/* Center Section - Space Selector (Desktop) */}
            <div className="hidden md:flex items-center space-x-4 flex-1 justify-center min-w-0">
              <div className="w-48 lg:w-64 flex-shrink-0">
                <SpaceSelector onManageSpace={onManageSpace} />
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-2">
                <Button
                  variant={currentView === 'recipes' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('recipes')}
                  className="flex items-center space-x-2 whitespace-nowrap px-4 py-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">Recipes</span>
                </Button>

                <Button
                  variant={currentView === 'mealplanner' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('mealplanner')}
                  className="flex items-center space-x-2 whitespace-nowrap px-4 py-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Meal Planner</span>
                </Button>
              </div>

              {/* Tablet Navigation - Icons with text */}
              <div className="flex md:flex lg:hidden items-center space-x-1">
                <Button
                  variant={currentView === 'recipes' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('recipes')}
                  className="flex items-center space-x-1 px-3 py-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs">Recipes</span>
                </Button>

                <Button
                  variant={currentView === 'mealplanner' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange('mealplanner')}
                  className="flex items-center space-x-1 px-3 py-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Planner</span>
                </Button>
              </div>
            </div>
            
            {/* Right Section - User Menu & Mobile Menu */}
            <div className="flex items-center space-x-2 justify-end flex-shrink-0">
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 min-h-[44px] min-w-[44px]"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>

              {/* User Menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center space-x-1 sm:space-x-2 transition-all duration-200 min-h-[44px] px-3 ${
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
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">Signed in as</p>
                        <p className="text-sm text-gray-600 truncate mt-1">{user?.email}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          onViewChange('settings')
                          setUserMenuOpen(false)
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-150 min-h-[44px] ${
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
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors duration-150 min-h-[44px]"
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 bg-white border-b border-gray-200 z-50 md:hidden animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-4 space-y-4">
              {/* Space Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipe Space</label>
                <SpaceSelector onManageSpace={onManageSpace} />
              </div>
              
              {/* Navigation */}
              <div className="space-y-2">
                <Button
                  variant={currentView === 'recipes' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    onViewChange('recipes')
                    setMobileMenuOpen(false)
                  }}
                  className="w-full justify-start space-x-3 min-h-[48px] text-left"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Recipes</span>
                </Button>

                <Button
                  variant={currentView === 'mealplanner' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    onViewChange('mealplanner')
                    setMobileMenuOpen(false)
                  }}
                  className="w-full justify-start space-x-3 min-h-[48px] text-left"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Meal Planner</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
