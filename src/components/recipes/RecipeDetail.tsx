import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { X, Clock, Users, ExternalLink, Copy, Share2, Edit } from 'lucide-react'
import { Database } from '../../lib/supabase'
import { formatQuantity, scaleRecipe, convertMeasurement } from '../../utils/measurements'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import toast from 'react-hot-toast'

type Recipe = Database['public']['Tables']['recipes']['Row'] & {
  ingredients: Database['public']['Tables']['ingredients']['Row'][]
  instructions: Database['public']['Tables']['instructions']['Row'][]
}

interface RecipeDetailProps {
  recipe: Recipe
  onClose: () => void
  onEdit?: (recipe: Recipe) => void
}

const RecipeDetailModal: React.FC<RecipeDetailProps> = ({ recipe, onClose, onEdit }) => {
  const [servings, setServings] = useState(recipe.servings)
  const { preferences } = useUserPreferences()
  const scaleFactor = servings / recipe.servings
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  const copyIngredients = () => {
    const ingredientsList = recipe.ingredients
      .map(ing => {
        const scaledQty = ing.amount ? scaleRecipe(ing.amount, scaleFactor) : null
        const qtyText = scaledQty ? `${scaledQty.displayQuantity}${ing.unit ? ` ${ing.unit}` : ''}` : ''
        const prepText = ing.preparation ? `, ${ing.preparation}` : ''
        return qtyText ? `${qtyText} ${ing.name}${prepText}` : `${ing.name}${prepText}`
      })
      .join('\n')
    
    navigator.clipboard.writeText(ingredientsList)
    toast.success('Ingredients copied to clipboard!')
  }
  
  const copyRecipe = () => {
    const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)
    const recipeText = `${recipe.title}

${recipe.description ? recipe.description + '\n' : ''}
Servings: ${servings}
${totalTime > 0 ? `Total Time: ${totalTime} minutes\n` : ''}
${recipe.source_url ? `Source: ${recipe.source_url}\n` : ''}

INGREDIENTS:
${recipe.ingredients.map(ing => {
  const scaledQty = ing.amount ? scaleRecipe(ing.amount, scaleFactor) : null
  const qtyText = scaledQty ? `${scaledQty.displayQuantity}${ing.unit ? ` ${ing.unit}` : ''}` : ''
  const prepText = ing.preparation ? `, ${ing.preparation}` : ''
  return `• ${qtyText ? `${qtyText} ${ing.name}${prepText}` : `${ing.name}${prepText}`}`
}).join('\n')}

INSTRUCTIONS:
${recipe.instructions.map((inst, index) => `${index + 1}. ${inst.instruction}`).join('\n')}`
    
    navigator.clipboard.writeText(recipeText)
    toast.success('Recipe copied to clipboard!')
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
      style={{ zIndex: 999999 }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{recipe.title}</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit && onEdit(recipe)}
              className="flex items-center space-x-1"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Recipe</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyIngredients}
              className="flex items-center space-x-1"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Ingredients</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyRecipe}
              className="flex items-center space-x-1"
            >
              <Share2 className="w-4 h-4" />
              <span>Copy Recipe</span>
            </Button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            {recipe.image_url && (
              <div className="aspect-video overflow-hidden rounded-xl mb-6">
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {recipe.description && (
              <p className="text-gray-600 mb-6">{recipe.description}</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Recipe Info */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <h3 className="font-semibold text-gray-900">Recipe Info</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Servings:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setServings(Math.max(1, servings - 1))}
                        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <span className="font-medium w-8 text-center">{servings}</span>
                      <button
                        onClick={() => setServings(servings + 1)}
                        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {recipe.prep_time && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Prep Time:</span>
                      <span className="font-medium">{recipe.prep_time}m</span>
                    </div>
                  )}
                  
                  {recipe.cook_time && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Cook Time:</span>
                      <span className="font-medium">{recipe.cook_time}m</span>
                    </div>
                  )}
                  
                  {recipe.difficulty && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className="font-medium capitalize">{recipe.difficulty}</span>
                    </div>
                  )}
                  
                  {recipe.source_url && (
                    <a
                      href={recipe.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View Original</span>
                    </a>
                  )}
                </CardContent>
              </Card>
              
              {/* Ingredients */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <h3 className="font-semibold text-gray-900">Ingredients</h3>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => {
                      const scaledQty = ingredient.amount 
                        ? scaleRecipe(ingredient.amount, scaleFactor)
                        : null
                      
                      // Convert to user's preferred measurement system
                      let displayQty = scaledQty
                      let displayUnit = ingredient.unit
                      let showOriginal = false
                      
                      if (scaledQty && ingredient.unit && preferences?.measurement_system) {
                        const converted = convertMeasurement(
                          scaledQty.quantity,
                          ingredient.unit,
                          preferences.measurement_system
                        )
                        if (converted && converted.originalQuantity && converted.originalUnit) {
                          displayQty = converted
                          displayUnit = converted.unit
                          showOriginal = true
                        }
                      }
                      
                      // Apply fraction preference to display
                      if (displayQty && preferences?.fraction_display !== undefined) {
                        displayQty = {
                          ...displayQty,
                          displayQuantity: formatQuantity(displayQty.quantity, preferences.fraction_display)
                        }
                      }
                      
                      return (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-700">
                            {displayQty && (
                              <span className="font-medium">
                                {displayQty.displayQuantity}{displayUnit ? ` ${displayUnit}` : ''}{' '}
                                {showOriginal && displayQty.originalQuantity && displayQty.originalUnit && (
                                  <span className="text-gray-500 font-normal">
                                    ({displayQty.originalDisplayQuantity} {displayQty.originalUnit}){' '}
                                  </span>
                                )}
                              </span>
                            )}
                            {ingredient.name}
                            {ingredient.preparation && (
                              <span className="text-gray-500 italic">
                                , {ingredient.preparation}
                              </span>
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
              
              {/* Instructions */}
              <Card className="md:col-span-3">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Instructions</h3>
                    <span className="text-sm text-gray-500">{recipe.instructions.length} steps</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {recipe.instructions.map((instruction, index) => (
                      <div key={index} className="flex items-start space-x-4 p-5 bg-gradient-to-r from-orange-50 to-orange-25 border border-orange-100 rounded-xl hover:shadow-md transition-all duration-200">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-orange-500 text-white font-bold rounded-full flex-shrink-0 shadow-sm">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-gray-800 leading-relaxed text-base font-medium">
                            {instruction.instruction}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onClose, onEdit }) => {
  return createPortal(
    <RecipeDetailModal recipe={recipe} onClose={onClose} onEdit={onEdit} />,
    document.body
  )
}