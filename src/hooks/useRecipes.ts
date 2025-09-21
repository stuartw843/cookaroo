import { useState, useEffect } from 'react'
import { supabase, Database } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSpacesContext } from '../contexts/SpacesContext'

type Recipe = Database['public']['Tables']['recipes']['Row']
type RecipeWithDetails = Recipe & {
  ingredients: Database['public']['Tables']['ingredients']['Row'][]
  instructions: Database['public']['Tables']['instructions']['Row'][]
}

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { currentSpace } = useSpacesContext()

  const fetchRecipes = async () => {
    if (!user || !currentSpace) {
      setRecipes([])
      setLoading(false)
      setInitialLoad(false)
      return
    }

    if (!user || !currentSpace) {
      setRecipes([])
      setLoading(false)
      setInitialLoad(false)
      return
    }

    try {
      setLoading(true)
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .eq('space_id', currentSpace.id)
        .order('created_at', { ascending: false })

      if (recipesError) throw recipesError

      if (recipesData) {
        const recipesWithDetails = await Promise.all(
          recipesData.map(async (recipe) => {
            const [ingredientsResult, instructionsResult] = await Promise.all([
              supabase
                .from('ingredients')
                .select('*')
                .eq('recipe_id', recipe.id)
                .order('order_index'),
              supabase
                .from('instructions')
                .select('*')
                .eq('recipe_id', recipe.id)
                .order('step_number')
            ])

            return {
              ...recipe,
              ingredients: ingredientsResult.data || [],
              instructions: instructionsResult.data || []
            }
          })
        )

        setRecipes(recipesWithDetails)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  const addRecipe = async (recipeData: {
    title: string
    description?: string
    notes?: string
    image_url?: string
    source_url?: string
    prep_time?: number
    cook_time?: number
    servings: number
    difficulty?: string
    tags?: string[]
    ingredients: { name: string; amount?: number; unit?: string; preparation?: string }[]
    instructions: { instruction: string }[]
  }) => {
    if (!user) throw new Error('User not authenticated')
    if (!currentSpace) throw new Error('No space selected. Please select or create a space first.')

    try {
      console.log('Adding recipe to space:', currentSpace.id)
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          ...recipeData,
          user_id: user.id,
          space_id: currentSpace.id,
          ingredients: undefined,
          instructions: undefined
        })
        .select()
        .single()

      if (recipeError) throw recipeError

      if (recipe) {
        // Add ingredients
        const ingredientsToInsert = recipeData.ingredients.map((ingredient, index) => ({
          recipe_id: recipe.id,
          name: ingredient.name,
          amount: ingredient.amount || null,
          unit: ingredient.unit,
          preparation: ingredient.preparation,
          order_index: index
        }))

        if (ingredientsToInsert.length > 0) {
          const { error: ingredientsError } = await supabase
            .from('ingredients')
            .insert(ingredientsToInsert)

          if (ingredientsError) throw ingredientsError
        }

        // Add instructions
        const instructionsToInsert = recipeData.instructions.map((instruction, index) => ({
          recipe_id: recipe.id,
          instruction: instruction.instruction,
          step_number: index + 1
        }))

        if (instructionsToInsert.length > 0) {
          const { error: instructionsError } = await supabase
            .from('instructions')
            .insert(instructionsToInsert)

          if (instructionsError) throw instructionsError
        }

        await fetchRecipes()
        return recipe
      }
    } catch (err) {
      console.error('Add recipe error:', err)
      throw err
    }
  }

  const updateRecipe = async (recipeId: string, recipeData: {
    title: string
    description?: string
    notes?: string
    image_url?: string
    source_url?: string
    prep_time?: number
    cook_time?: number
    servings: number
    difficulty?: string
    tags?: string[]
    ingredients: { name: string; amount?: number; unit?: string; preparation?: string }[]
    instructions: { instruction: string }[]
  }) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Update the recipe
      const { error: recipeError } = await supabase
        .from('recipes')
        .update({
          title: recipeData.title,
          description: recipeData.description || null,
          notes: recipeData.notes || null,
          image_url: recipeData.image_url || null,
          source_url: recipeData.source_url || null,
          prep_time: recipeData.prep_time || null,
          cook_time: recipeData.cook_time || null,
          servings: recipeData.servings,
          difficulty: recipeData.difficulty || null,
          tags: recipeData.tags || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', recipeId)

      if (recipeError) throw recipeError

      // Delete existing ingredients and instructions
      await Promise.all([
        supabase.from('ingredients').delete().eq('recipe_id', recipeId),
        supabase.from('instructions').delete().eq('recipe_id', recipeId)
      ])

      // Add new ingredients
      if (recipeData.ingredients.length > 0) {
        const ingredientsToInsert = recipeData.ingredients.map((ingredient, index) => ({
          recipe_id: recipeId,
          name: ingredient.name,
          amount: ingredient.amount || null,
          unit: ingredient.unit,
          preparation: ingredient.preparation,
          order_index: index
        }))

        const { error: ingredientsError } = await supabase
          .from('ingredients')
          .insert(ingredientsToInsert)

        if (ingredientsError) throw ingredientsError
      }

      // Add new instructions
      if (recipeData.instructions.length > 0) {
        const instructionsToInsert = recipeData.instructions.map((instruction, index) => ({
          recipe_id: recipeId,
          instruction: instruction.instruction,
          step_number: index + 1
        }))

        const { error: instructionsError } = await supabase
          .from('instructions')
          .insert(instructionsToInsert)

        if (instructionsError) throw instructionsError
      }

      await fetchRecipes()
    } catch (err) {
      console.error('Update recipe error:', err)
      throw err
    }
  }

  const deleteRecipe = async (recipeId: string) => {
    try {
      // First, delete meal plan items that have no custom_text (would violate constraint if recipe_id set to null)
      const { error: deleteMealPlanError } = await supabase
        .from('meal_plan_items')
        .delete()
        .eq('recipe_id', recipeId)
        .is('custom_text', null)

      if (deleteMealPlanError) {
        console.warn('Warning: Could not delete meal plan items:', deleteMealPlanError)
        // Continue with deletion even if this fails
      }

      // Then, update meal plan items that have custom_text to set recipe_id to null
      const { error: updateMealPlanError } = await supabase
        .from('meal_plan_items')
        .update({ recipe_id: null })
        .eq('recipe_id', recipeId)
        .not('custom_text', 'is', null)

      if (updateMealPlanError) {
        console.warn('Warning: Could not update meal plan items:', updateMealPlanError)
        // Continue with deletion even if this fails
      }

      // Delete the recipe (ingredients and instructions should cascade automatically)
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)

      if (error) throw error
      await fetchRecipes()
    } catch (err) {
      console.error('Recipe deletion error:', err)
      throw err
    }
  }

  useEffect(() => {
    console.log('useRecipes effect triggered:', { user: !!user, currentSpace: currentSpace?.id })
    fetchRecipes()
  }, [user?.id, currentSpace?.id])

  return {
    recipes,
    loading,
    initialLoad,
    error,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    refetch: fetchRecipes
  }
}