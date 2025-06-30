import React from 'react'
import { useParams } from 'react-router-dom'
import { useRecipes } from '../../hooks/useRecipes'
import { AddRecipeForm } from './AddRecipeForm'

export const AddRecipePage: React.FC = () => {
  const { recipes, addRecipe, updateRecipe } = useRecipes()
  const { id } = useParams<{ id?: string }>()
  const recipe = id ? recipes.find(r => r.id === id) : undefined

  return (
    <AddRecipeForm
      onAdd={addRecipe}
      onUpdate={updateRecipe}
      recipe={recipe}
    />
  )
}
