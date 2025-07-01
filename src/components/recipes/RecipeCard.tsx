import React from 'react'
import { Card, CardContent } from '../ui/Card'
import { Clock, Users, ExternalLink, Tag, ChefHat } from 'lucide-react'
import { Database } from '../../lib/supabase'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import { convertMeasurement, formatQuantity } from '../../utils/measurements'

type Recipe = Database['public']['Tables']['recipes']['Row'] & {
  ingredients: Database['public']['Tables']['ingredients']['Row'][]
  instructions: Database['public']['Tables']['instructions']['Row'][]
}

interface RecipeCardProps {
  recipe: Recipe
  onClick: (recipe: Recipe) => void
  viewMode?: 'grid' | 'list'
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, viewMode = 'grid' }) => {
  const { preferences } = useUserPreferences()
  
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)
  
  if (viewMode === 'list') {
    return (
      <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 group active:scale-[0.98]">
        <div onClick={() => onClick(recipe)} className="flex items-center p-4 sm:p-6 space-x-4 min-h-[120px]">
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden rounded-lg">
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <ChefHat className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 line-clamp-2 leading-tight">
              {recipe.title}
            </h3>
            {recipe.description && (
              <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                {recipe.description}
              </p>
            )}
            
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
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
              {recipe.source_url && (
                <ExternalLink className="w-4 h-4 text-gray-400" />
              )}
            </div>
            
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {recipe.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
                {recipe.tags.length > 2 && (
                  <span className="text-xs text-gray-500 py-1">
                    +{recipe.tags.length - 2} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }
  
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 group active:scale-[0.98]">
      <div onClick={() => onClick(recipe)} className="min-h-[280px] flex flex-col">
        <div className="aspect-video overflow-hidden rounded-t-xl flex-shrink-0">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        
        <CardContent className="space-y-3 flex-1 flex flex-col p-4 sm:p-6">
          <div className="flex-1">
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 line-clamp-2 leading-tight">
              {recipe.title}
            </h3>
            {recipe.description && (
              <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                {recipe.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
            <div className="flex items-center space-x-3">
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
            
            {recipe.source_url && (
              <ExternalLink className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {recipe.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
              {recipe.tags.length > 2 && (
                <span className="text-xs text-gray-500 py-1">
                  +{recipe.tags.length - 2} more
                </span>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
