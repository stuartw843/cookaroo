import React, { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameWeek } from 'date-fns'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { MealPlanGrid } from './MealPlanGrid'
import { MealPlanSelector } from './MealPlanSelector'
import { RecipeDetail } from '../recipes/RecipeDetail'
import { useMealPlans } from '../../hooks/useMealPlans'
import { useRecipes } from '../../hooks/useRecipes'
import { ChevronLeft, ChevronRight, Plus, Copy, Calendar, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export const MealPlannerView: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }))
  const [editMode, setEditMode] = useState(false)
  const [showRecipeSelector, setShowRecipeSelector] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; meal: string } | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [editingRecipe, setEditingRecipe] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  
  const { 
    mealPlans, 
    currentMealPlan, 
    setCurrentMealPlan, 
    loading,
    initialLoad,
    createMealPlan, 
    duplicateMealPlan, 
    updateMealPlanItem,
    deleteMealPlan 
  } = useMealPlans()
  
  const { recipes, addRecipe, updateRecipe } = useRecipes()
  
  const handleEditRecipe = (recipe: any) => {
    setEditingRecipe(recipe)
    setSelectedRecipe(null) // Close detail modal
    setShowAddModal(true) // Open edit modal
  }
  
  const handleCloseAddModal = () => {
    setShowAddModal(false)
    setEditingRecipe(null)
  }

  // Find meal plan for selected week
  const selectedWeekPlan = mealPlans.find(plan => 
    plan.week_start_date === format(selectedWeek, 'yyyy-MM-dd')
  )

  useEffect(() => {
    if (selectedWeekPlan) {
      setCurrentMealPlan(selectedWeekPlan)
    }
  }, [selectedWeekPlan, setCurrentMealPlan])

  const handlePreviousWeek = () => {
    setSelectedWeek(prev => subWeeks(prev, 1))
  }

  const handleNextWeek = () => {
    setSelectedWeek(prev => addWeeks(prev, 1))
  }

  const handleCreateMealPlan = async () => {
    try {
      const newPlan = await createMealPlan(selectedWeek)
      setCurrentMealPlan(newPlan)
      setEditMode(true) // Automatically enter edit mode
      toast.success('Meal plan created!')
    } catch (error) {
      toast.error('Failed to create meal plan')
    }
  }

  const handleDuplicatePlan = async (sourcePlanId: string) => {
    try {
      await duplicateMealPlan(sourcePlanId, selectedWeek)
      setEditMode(true) // Automatically enter edit mode for duplicated plan
      toast.success('Meal plan duplicated!')
    } catch (error) {
      toast.error('Failed to duplicate meal plan')
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this meal plan?')) {
      try {
        await deleteMealPlan(planId)
        toast.success('Meal plan deleted!')
      } catch (error) {
        toast.error('Failed to delete meal plan')
      }
    }
  }

  const handleSlotClick = (day: number, meal: string) => {
    if (!editMode) return
    setSelectedSlot({ day, meal })
    setShowRecipeSelector(true)
  }

  const handleRecipeSelect = async (recipeId: string | null, customText?: string) => {
    if (!selectedSlot || !selectedWeekPlan) return

    try {
      await updateMealPlanItem(
        selectedWeekPlan.id,
        selectedSlot.day,
        selectedSlot.meal,
        {
          recipe_id: recipeId,
          custom_text: customText || null
        }
      )
      setShowRecipeSelector(false)
      setSelectedSlot(null)
      toast.success('Meal updated!')
    } catch (error) {
      toast.error('Failed to update meal')
    }
  }

  const handleRemoveMeal = async (day: number, meal: string) => {
    if (!selectedWeekPlan) return

    if (window.confirm('Are you sure you want to remove this meal?')) {
      try {
        await updateMealPlanItem(
          selectedWeekPlan.id,
          day,
          meal,
          {
            recipe_id: null,
            custom_text: null
          }
        )
        toast.success('Meal removed!')
      } catch (error) {
        toast.error('Failed to remove meal')
      }
    }
  }
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(selectedWeek, i))
  const isCurrentWeek = isSameWeek(selectedWeek, new Date(), { weekStartsOn: 0 })

  if (loading || initialLoad) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meal Planner</h1>
          <p className="text-gray-600 mt-1">Plan your weekly meals and stay organized</p>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600">Loading meal plans...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Meal Planner</h1>
          <p className="text-gray-600 mt-2">Plan your weekly meals and stay organized</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          {selectedWeekPlan && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDuplicatePlan(selectedWeekPlan.id)}
                className="w-full sm:w-auto"
              >
                <Copy className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Duplicate Week</span>
                <span className="sm:hidden">Duplicate</span>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeletePlan(selectedWeekPlan.id)}
                className="w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Delete Plan</span>
                <span className="sm:hidden">Delete</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <Card className="shadow-lg">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <Button variant="outline" onClick={handlePreviousWeek}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Previous Week</span>
              <span className="sm:hidden">Previous</span>
            </Button>
            
            <div className="text-center px-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {format(selectedWeek, 'MMMM d')} - {format(addDays(selectedWeek, 6), 'MMMM d, yyyy')}
              </h2>
              {isCurrentWeek && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 mt-2 font-medium">
                  <Calendar className="w-3 h-3 mr-1" />
                  Current Week
                </span>
              )}
            </div>
            
            <Button variant="outline" onClick={handleNextWeek}>
              <span className="hidden sm:inline">Next Week</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Meal Plan Content */}
      {selectedWeekPlan ? (
        <MealPlanGrid
          mealPlan={selectedWeekPlan}
          weekDays={weekDays}
          editMode={editMode}
          onToggleEditMode={() => setEditMode(!editMode)}
          onSlotClick={handleSlotClick}
          onRecipeClick={(recipe) => {
            // Find the complete recipe object from the recipes array
            const fullRecipe = recipes.find(r => r.id === recipe.id)
            if (fullRecipe) {
              setSelectedRecipe(fullRecipe)
            }
          }}
          onRemoveMeal={handleRemoveMeal}
        />
      ) : (
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              No meal plan for this week
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create a meal plan to start organizing your weekly meals.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button onClick={handleCreateMealPlan}>
                <Plus className="w-4 h-4 mr-1" />
                Create Meal Plan
              </Button>
              {mealPlans.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const lastPlan = mealPlans[0]
                    handleDuplicatePlan(lastPlan.id)
                  }}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy from Previous
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Meal Plans */}
      {mealPlans.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <h3 className="text-xl font-bold text-gray-900">Previous Meal Plans</h3>
            <p className="text-gray-600 text-sm mt-1">Quick access to your recent meal plans</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mealPlans.slice(0, 6).map(plan => {
                const planWeekStart = new Date(plan.week_start_date)
                const planWeekEnd = addDays(planWeekStart, 6)
                const mealCount = plan.items.length
                
                return (
                  <div
                    key={plan.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all duration-200 cursor-pointer bg-gradient-to-br from-white to-gray-50"
                    onClick={() => setSelectedWeek(planWeekStart)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900">
                        {format(planWeekStart, 'MMM d')} - {format(planWeekEnd, 'MMM d')}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicatePlan(plan.id)
                        }}
                        className="hover:bg-orange-50 hover:text-orange-600"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {mealCount} meal{mealCount !== 1 ? 's' : ''} planned
                    </p>
                    {plan.name && (
                      <p className="text-sm text-orange-600 font-medium">{plan.name}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recipe Selector Modal */}
      {showRecipeSelector && selectedSlot && (
        <MealPlanSelector
          isOpen={showRecipeSelector}
          onClose={() => {
            setShowRecipeSelector(false)
            setSelectedSlot(null)
          }}
          onSelect={handleRecipeSelect}
          recipes={recipes}
          selectedDay={selectedSlot.day}
          selectedMeal={selectedSlot.meal}
          weekDays={weekDays}
        />
      )}
      
      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onEdit={handleEditRecipe}
        />
      )}
      
      {/* Add/Edit Recipe Modal */}
      {showAddModal && (
        <AddRecipeModal
          isOpen={showAddModal}
          onClose={handleCloseAddModal}
          onAdd={addRecipe}
          recipe={editingRecipe}
          onUpdate={updateRecipe}
        />
      )}
    </div>
  )
}