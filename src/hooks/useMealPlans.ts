import { useState, useEffect } from 'react'
import { supabase, Database } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSpacesContext } from '../contexts/SpacesContext'
import { format, startOfWeek, addWeeks } from 'date-fns'

type MealPlan = Database['public']['Tables']['meal_plans']['Row']
type MealPlanItem = Database['public']['Tables']['meal_plan_items']['Row'] & {
  recipe?: Database['public']['Tables']['recipes']['Row']
}

type MealPlanWithItems = MealPlan & {
  items: MealPlanItem[]
}

export const useMealPlans = () => {
  const [mealPlans, setMealPlans] = useState<MealPlanWithItems[]>([])
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlanWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { currentSpace } = useSpacesContext()

  const fetchMealPlans = async () => {
    if (!user || !currentSpace) {
      setMealPlans([])
      setCurrentMealPlan(null)
      setLoading(false)
      setInitialLoad(false)
      return
    }

    try {
      setLoading(true)
      const { data: mealPlansData, error: mealPlansError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('space_id', currentSpace.id)
        .order('week_start_date', { ascending: false })

      if (mealPlansError) throw mealPlansError

      if (mealPlansData) {
        const mealPlansWithItems = await Promise.all(
          mealPlansData.map(async (mealPlan) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from('meal_plan_items')
              .select(`
                *,
                recipe:recipes(*)
              `)
              .eq('meal_plan_id', mealPlan.id)
              .order('day_of_week')
              .order('meal_type')

            if (itemsError) throw itemsError

            return {
              ...mealPlan,
              items: itemsData || []
            }
          })
        )

        setMealPlans(mealPlansWithItems)
        
        // Set current week as default if no current meal plan
        if (!currentMealPlan && mealPlansWithItems.length > 0) {
          const thisWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd')
          const thisWeekPlan = mealPlansWithItems.find(plan => plan.week_start_date === thisWeekStart)
          setCurrentMealPlan(thisWeekPlan || mealPlansWithItems[0])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  const createMealPlan = async (weekStartDate: Date, name?: string) => {
    if (!user || !currentSpace) throw new Error('User not authenticated or no space selected')

    try {
      const { data: mealPlan, error: mealPlanError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          space_id: currentSpace.id,
          week_start_date: format(weekStartDate, 'yyyy-MM-dd'),
          name
        })
        .select()
        .single()

      if (mealPlanError) throw mealPlanError

      await fetchMealPlans()
      return mealPlan
    } catch (err) {
      throw err
    }
  }

  const duplicateMealPlan = async (sourceMealPlanId: string, targetWeekStartDate: Date) => {
    if (!user || !currentSpace) throw new Error('User not authenticated or no space selected')

    try {
      // Create new meal plan
      const { data: newMealPlan, error: mealPlanError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          space_id: currentSpace.id,
          week_start_date: format(targetWeekStartDate, 'yyyy-MM-dd'),
          name: `Copied from ${format(targetWeekStartDate, 'MMM d, yyyy')}`
        })
        .select()
        .single()

      if (mealPlanError) throw mealPlanError

      // Get source meal plan items
      const { data: sourceItems, error: sourceItemsError } = await supabase
        .from('meal_plan_items')
        .select('*')
        .eq('meal_plan_id', sourceMealPlanId)

      if (sourceItemsError) throw sourceItemsError

      // Copy items to new meal plan
      if (sourceItems && sourceItems.length > 0) {
        // Filter out items that have both recipe_id and custom_text as null
        // to avoid violating the meal_plan_items_content_check constraint
        const validSourceItems = sourceItems.filter(item => 
          item.recipe_id !== null || (item.custom_text !== null && item.custom_text.trim() !== '')
        )
        
        const newItems = validSourceItems.map(item => ({
          meal_plan_id: newMealPlan.id,
          day_of_week: item.day_of_week,
          meal_type: item.meal_type,
          recipe_id: item.recipe_id,
          custom_text: item.custom_text,
          notes: item.notes
        }))

        if (newItems.length > 0) {
          const { error: insertError } = await supabase
            .from('meal_plan_items')
            .insert(newItems)

          if (insertError) throw insertError
        }
      }

      await fetchMealPlans()
      return newMealPlan
    } catch (err) {
      throw err
    }
  }

  const updateMealPlanItem = async (
    mealPlanId: string,
    dayOfWeek: number,
    mealType: string,
    data: {
      recipe_id?: string | null
      custom_text?: string | null
      notes?: string | null
    }
  ) => {
    try {
      // Check if item exists
      const { data: existingItem } = await supabase
        .from('meal_plan_items')
        .select('id')
        .eq('meal_plan_id', mealPlanId)
        .eq('day_of_week', dayOfWeek)
        .eq('meal_type', mealType)
        .maybeSingle()

      if (existingItem) {
        // If both recipe_id and custom_text are null, delete the item
        if (!data.recipe_id && !data.custom_text) {
          const { error } = await supabase
            .from('meal_plan_items')
            .delete()
            .eq('id', existingItem.id)

          if (error) throw error
        } else {
          // Update existing item
          const { error } = await supabase
            .from('meal_plan_items')
            .update(data)
            .eq('id', existingItem.id)

          if (error) throw error
        }
      } else {
        // Only create new item if there's actual content
        if (data.recipe_id || (data.custom_text && data.custom_text.trim() !== '')) {
          const { error } = await supabase
            .from('meal_plan_items')
            .insert({
              meal_plan_id: mealPlanId,
              day_of_week: dayOfWeek,
              meal_type: mealType,
              ...data
            })

          if (error) throw error
        }
      }

      // Update the current meal plan in state without full refetch
      if (currentMealPlan && currentMealPlan.id === mealPlanId) {
        // Fetch just the updated items for this meal plan
        const { data: updatedItems, error: itemsError } = await supabase
          .from('meal_plan_items')
          .select(`
            *,
            recipe:recipes(*)
          `)
          .eq('meal_plan_id', mealPlanId)
          .order('day_of_week')
          .order('meal_type')

        if (itemsError) throw itemsError

        const updatedMealPlan = {
          ...currentMealPlan,
          items: updatedItems || []
        }

        setCurrentMealPlan(updatedMealPlan)
        
        // Update the meal plan in the mealPlans array
        setMealPlans(prev => prev.map(plan => 
          plan.id === mealPlanId ? updatedMealPlan : plan
        ))
      }
    } catch (err) {
      throw err
    }
  }

  const deleteMealPlanItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('meal_plan_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      await fetchMealPlans()
    } catch (err) {
      throw err
    }
  }

  const deleteMealPlan = async (mealPlanId: string) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', mealPlanId)

      if (error) throw error
      await fetchMealPlans()
    } catch (err) {
      throw err
    }
  }

  const getCurrentWeekMealPlan = async () => {
    if (!user || !currentSpace) return null

    const thisWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd')
    
    try {
      const { data: mealPlan, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          items:meal_plan_items(
            *,
            recipe:recipes(*)
          )
        `)
        .eq('space_id', currentSpace.id)
        .eq('week_start_date', thisWeekStart)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return mealPlan || null
    } catch (err) {
      console.error('Error fetching current week meal plan:', err)
      return null
    }
  }

  useEffect(() => {
    fetchMealPlans()
  }, [user, currentSpace])

  return {
    mealPlans,
    currentMealPlan,
    setCurrentMealPlan,
    loading,
    initialLoad,
    error,
    createMealPlan,
    duplicateMealPlan,
    updateMealPlanItem,
    deleteMealPlanItem,
    deleteMealPlan,
    getCurrentWeekMealPlan,
    refetch: fetchMealPlans
  }
}