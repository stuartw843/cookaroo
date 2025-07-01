import React from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Plus, Clock, Users, ExternalLink, Edit3, Eye, BookOpen, X } from 'lucide-react'
import { Database } from '../../lib/supabase'

type MealPlanItem = Database['public']['Tables']['meal_plan_items']['Row'] & {
  recipe?: Database['public']['Tables']['recipes']['Row']
}

type MealPlanWithItems = Database['public']['Tables']['meal_plans']['Row'] & {
  items: MealPlanItem[]
}

interface MealPlanGridProps {
  mealPlan: MealPlanWithItems
  weekDays: Date[]
  editMode: boolean
  onToggleEditMode: () => void
  onSlotClick: (day: number, meal: string) => void
  onRecipeClick?: (recipe: any) => void
  onRemoveMeal?: (day: number, meal: string) => void
}

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', color: 'bg-yellow-50 border-yellow-200' },
  { key: 'lunch', label: 'Lunch', color: 'bg-blue-50 border-blue-200' },
  { key: 'dinner', label: 'Dinner', color: 'bg-purple-50 border-purple-200' },
  { key: 'snack', label: 'Snack', color: 'bg-green-50 border-green-200' }
]

export const MealPlanGrid: React.FC<MealPlanGridProps> = ({
  mealPlan,
  weekDays,
  editMode,
  onToggleEditMode,
  onSlotClick,
  onRecipeClick,
  onRemoveMeal
}) => {
  const getMealItem = (dayOfWeek: number, mealType: string) => {
    return mealPlan.items.find(
      item => item.day_of_week === dayOfWeek && item.meal_type === mealType
    )
  }

  // Check if a meal type has any items across all days
  const mealTypeHasItems = (mealTypeKey: string) => {
    return weekDays.some((day) => getMealItem(day.getDay(), mealTypeKey))
  }

  // Filter meal types to show only those with items in view mode
  const visibleMealTypes = editMode 
    ? MEAL_TYPES 
    : MEAL_TYPES.filter(mealType => mealTypeHasItems(mealType.key))

  const MealSlot: React.FC<{
    dayOfWeek: number
    mealType: string
    mealColor: string
    item?: MealPlanItem
  }> = ({ dayOfWeek, mealType, mealColor, item }) => {
    // Show placeholder in view mode for empty slots
    if (!editMode && !item) {
      return (
        <div className={`p-3 rounded-lg min-h-[80px] border border-dashed border-gray-200 bg-gray-50`}>
        </div>
      )
    }

    return (
      <div
        className={`p-3 rounded-lg min-h-[80px] transition-all duration-200 ${
          editMode 
            ? `border-2 border-dashed cursor-pointer hover:border-orange-300 hover:shadow-md ${mealColor}` 
            : `border border-solid shadow-sm hover:shadow-md ${mealColor.replace('border-dashed', 'border-solid')}`
        }`}
        onClick={editMode ? () => onSlotClick(dayOfWeek, mealType) : undefined}
      >
        {item ? (
          <div className={`space-y-1 ${editMode ? '' : 'cursor-default'}`}>
            {item.recipe ? (
              <div className="space-y-1">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1 pr-1" title={item.recipe.title}>
                    {item.recipe.title}
                  </h4>
                  {editMode && onRemoveMeal && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveMeal(dayOfWeek, mealType)
                      }}
                      className="p-0.5 h-4 w-4 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {item.recipe.prep_time && item.recipe.cook_time && (
                      <div className="flex items-center space-x-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{item.recipe.prep_time + item.recipe.cook_time}m</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-0.5">
                      <Users className="w-3 h-3" />
                      <span>{item.recipe.servings}</span>
                    </div>
                  </div>
                  
                  {!editMode && onRecipeClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRecipeClick(item.recipe)
                      }}
                      className="p-0.5 h-4 w-4"
                    >
                      <BookOpen className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                {editMode && item.recipe.source_url && (
                  <div className="flex items-center text-xs text-gray-500">
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <p className="text-gray-800 font-semibold text-sm leading-tight flex-1 pr-1" title={item.custom_text || ''}>
                    {item.custom_text}
                  </p>
                  {editMode && onRemoveMeal && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveMeal(dayOfWeek, mealType)
                      }}
                      className="p-0.5 h-4 w-4 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
            {item.notes && editMode && (
              <p className="text-xs text-gray-500 italic line-clamp-1" title={item.notes}>
                Note: {item.notes}
              </p>
            )}
          </div>
        ) : editMode ? (
          <div className="flex items-center justify-center h-full">
            <Button variant="ghost" size="sm" className="text-gray-500 text-xs p-2 hover:bg-orange-50 hover:text-orange-600">
              <Plus className="w-3 h-3 mr-1" />
              Add meal
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Week of {format(weekDays[0], 'MMMM d, yyyy')}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d')}
            </p>
          </div>
          <Button
            variant={editMode ? "primary" : "outline"}
            size="sm"
            onClick={onToggleEditMode}
            className="flex items-center space-x-2"
          >
            {editMode ? (
              <>
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">View Mode</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Mode</span>
              </>
            )}
          </Button>
        </div>
        {editMode && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-orange-800">
              <strong>Edit Mode:</strong> Click on any meal slot to add or change meals. Click "View Mode" when you're done editing.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Mobile View - Improved Card Layout */}
        <div className="block lg:hidden space-y-4">
          {weekDays.map((day, dayIndex) => {
            const actualDayOfWeek = day.getDay() // 0 = Sunday, 1 = Monday, etc.
            // Show meal types for each day
            const dayMeals = visibleMealTypes.map(mealType => ({
              mealType,
              item: getMealItem(actualDayOfWeek, mealType.key)
            })).filter(({ item }) => editMode || item)
            
            // Skip days with no meals in view mode
            if (!editMode && dayMeals.length === 0) return null
            
            return (
              <Card key={dayIndex} className="bg-gradient-to-r from-gray-50 to-white border-l-4 border-l-orange-400">
                <CardContent className="p-4">
                  <h4 className="font-bold text-gray-900 mb-3 text-center text-lg">
                    {format(day, 'EEEE')}
                  </h4>
                  <p className="text-center text-sm text-gray-600 mb-4">
                    {format(day, 'MMMM d')}
                  </p>
                  <div className="space-y-3">
                    {dayMeals.map(({ mealType, item }) => (
                      <div key={mealType.key}>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            mealType.key === 'breakfast' ? 'bg-yellow-400' :
                            mealType.key === 'lunch' ? 'bg-blue-400' :
                            mealType.key === 'dinner' ? 'bg-purple-400' : 'bg-green-400'
                          }`}></div>
                          <span className="text-sm font-semibold text-gray-700">
                            {mealType.label}
                          </span>
                        </div>
                        <MealSlot
                          dayOfWeek={actualDayOfWeek}
                          mealType={mealType.key}
                          mealColor={mealType.color}
                          item={item}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Desktop View - Enhanced Grid Layout */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-3 mb-4">
                <div className="font-bold text-gray-700 text-center py-3 text-sm bg-gray-50 rounded-lg">
                  Meal Type
                </div>
                {weekDays.map((day, index) => (
                  <div key={index} className="text-center py-3 bg-gradient-to-b from-orange-50 to-orange-100 rounded-lg">
                    <div className="font-bold text-gray-900 text-sm">
                      {format(day, 'EEE')}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {format(day, 'MMM d')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Meal Rows */}
              <div className="space-y-3">
                {visibleMealTypes.map(mealType => (
                  <div key={mealType.key} className="grid grid-cols-8 gap-3">
                    <div className="flex items-center justify-center py-3 font-bold text-gray-700 text-center text-sm bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          mealType.key === 'breakfast' ? 'bg-yellow-400' :
                          mealType.key === 'lunch' ? 'bg-blue-400' :
                          mealType.key === 'dinner' ? 'bg-purple-400' : 'bg-green-400'
                        }`}></div>
                        <span>{mealType.label}</span>
                      </div>
                    </div>
                    {weekDays.map((day, dayIndex) => {
                      const actualDayOfWeek = day.getDay() // 0 = Sunday, 1 = Monday, etc.
                      const item = getMealItem(actualDayOfWeek, mealType.key)
                      return (
                        <MealSlot
                          key={`${dayIndex}-${mealType.key}`}
                          dayOfWeek={actualDayOfWeek}
                          mealType={mealType.key}
                          mealColor={mealType.color}
                          item={item}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
