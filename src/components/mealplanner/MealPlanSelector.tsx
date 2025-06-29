import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { X, Search, Clock, Users, Plus } from 'lucide-react'
import { Database } from '../../lib/supabase'

type Recipe = Database['public']['Tables']['recipes']['Row']

interface MealPlanSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (recipeId: string | null, customText?: string) => void
  recipes: Recipe[]
  selectedDay: number
  selectedMeal: string
  weekDays: Date[]
}

export const MealPlanSelector: React.FC<MealPlanSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  recipes,
  selectedDay,
  selectedMeal,
  weekDays
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [customText, setCustomText] = useState('')
  const [mode, setMode] = useState<'recipe' | 'custom'>('recipe')

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      // Prevent body scroll when modal is open
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen, onClose])

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const dayName = format(weekDays[selectedDay], 'EEEE, MMMM d')

  const handleRecipeSelect = (recipe: Recipe) => {
    onSelect(recipe.id)
  }

  const handleCustomSubmit = () => {
    if (customText.trim()) {
      onSelect(null, customText.trim())
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[99999]"
      onClick={handleBackdropClick}
      style={{ zIndex: 99999 }}
    >
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative z-[99999] mx-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Add {selectedMeal} for {dayName}
            </h2>
            <p className="text-gray-600 mt-1">
              Choose a recipe or add a custom meal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Mode Selection */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
            <Button
              variant={mode === 'recipe' ? 'primary' : 'outline'}
              onClick={() => setMode('recipe')}
              className="w-full sm:w-auto"
            >
              Choose Recipe
            </Button>
            <Button
              variant={mode === 'custom' ? 'primary' : 'outline'}
              onClick={() => setMode('custom')}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-1" />
              Custom Meal
            </Button>
          </div>

          {mode === 'recipe' ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Recipe List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredRecipes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {searchQuery ? 'No recipes found' : 'No recipes available'}
                  </div>
                ) : (
                  filteredRecipes.map(recipe => {
                    const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)
                    
                    return (
                      <Card
                        key={recipe.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleRecipeSelect(recipe)}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
                            {recipe.image_url && (
                              <img
                                src={recipe.image_url}
                                alt={recipe.title}
                                className="w-full h-32 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">
                                {recipe.title}
                              </h3>
                              {recipe.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {recipe.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                {totalTime > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{totalTime}m</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-1">
                                  <Users className="w-4 h-4" />
                                  <span>{recipe.servings}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Meal Description
                </label>
                <textarea
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter your custom meal (e.g., 'Leftover pizza', 'Eating out at Italian restaurant', 'Homemade smoothie')"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCustomSubmit}
                  disabled={!customText.trim()}
                  className="w-full sm:w-auto"
                >
                  Add Custom Meal
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}