import { useState, useEffect } from 'react'
import { supabase, Database } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSpacesContext } from '../contexts/SpacesContext'

type AIRecipeCollection = Database['public']['Tables']['ai_recipe_collections']['Row']

export const useAIRecipeCollections = () => {
  const [collections, setCollections] = useState<AIRecipeCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { currentSpace } = useSpacesContext()

  const fetchCollections = async () => {
    if (!user || !currentSpace) {
      setCollections([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('ai_recipe_collections')
        .select('*')
        .eq('space_id', currentSpace.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setCollections(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createCollection = async (name: string, systemPrompt: string) => {
    if (!user || !currentSpace) throw new Error('User not authenticated or no space selected')

    try {
      const { data, error } = await supabase
        .from('ai_recipe_collections')
        .insert({
          space_id: currentSpace.id,
          name: name.trim(),
          system_prompt: systemPrompt.trim()
        })
        .select()
        .single()

      if (error) throw error

      await fetchCollections()
      return data
    } catch (err) {
      throw err
    }
  }

  const updateCollection = async (collectionId: string, updates: { name?: string; system_prompt?: string }) => {
    try {
      const { error } = await supabase
        .from('ai_recipe_collections')
        .update(updates)
        .eq('id', collectionId)

      if (error) throw error
      await fetchCollections()
    } catch (err) {
      throw err
    }
  }

  const deleteCollection = async (collectionId: string) => {
    try {
      const { error } = await supabase
        .from('ai_recipe_collections')
        .delete()
        .eq('id', collectionId)

      if (error) throw error
      await fetchCollections()
    } catch (err) {
      throw err
    }
  }

  const generateRecipe = async (collectionId: string, userPrompt?: string) => {
    if (!user || !currentSpace) throw new Error('User not authenticated or no space selected')

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-recipe`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection_id: collectionId,
          user_prompt: userPrompt,
          space_id: currentSpace.id
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to generate recipe'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Server error: ${response.status}`
        }
        throw new Error(errorMessage)
      }
      
      const generatedRecipe = await response.json()
      return generatedRecipe
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchCollections()
  }, [user, currentSpace])

  return {
    collections,
    loading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    generateRecipe,
    refetch: fetchCollections
  }
}