import React from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Clock, Users, Trash2, ExternalLink, Tag } from 'lucide-react'
import { Database } from '../../lib/supabase'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import { convertMeasurement, formatQuantity } from '../../utils/measurements'

type Recipe = Database['public']['Tables']['recipes']['Row'] & {
  ingredients: Database['public']['Tables']['ingredients']['Row'][]
  instructions: Database['public']['Tables']['instructions']['Row'][]
}

interface RecipeCardProps {
  recipe: Recipe
  onDelete: (id: string) => void
  onClick: (recipe: Recipe) => void
  viewMode?: 'grid' | 'list'
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onDelete, onClick, viewMode = 'grid' }) => {
  const { preferences } = useUserPreferences()
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      onDelete(recipe.id)
    }
  }
  
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)
  
  if (viewMode === 'list') {
    return (
      <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 group">
        <div onClick={() => onClick(recipe)} className="flex items-center p-4 space-x-4">
          {recipe.image_url && (
            <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {recipe.title}
            </h3>
            {recipe.description && (
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
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
              {recipe.source_url && (
                <ExternalLink className="w-4 h-4 text-gray-400" />
              )}
            </div>
            
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {recipe.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
                {recipe.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{recipe.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0">
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </Card>
    )
  }
  
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 group">
      <div onClick={() => onClick(recipe)}>
        {recipe.image_url && (
          <div className="aspect-video overflow-hidden rounded-t-xl">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}
        
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
              {recipe.title}
            </h3>
            {recipe.description && (
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                {recipe.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
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
            <div className="flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{recipe.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </CardContent>
      </div>
      
      <div className="px-6 pb-4">
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>
    </Card>
  )
}