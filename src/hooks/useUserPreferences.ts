import { useState, useEffect } from 'react'
import { supabase, Database } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSpacesContext } from '../contexts/SpacesContext'

type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
type MeasurementSystem = 'metric' | 'imperial' | 'us'

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { currentSpace } = useSpacesContext()

  const fetchPreferences = async () => {
    if (!user) {
      setPreferences(null)
      setLoading(false)
      return
    }

    if (!currentSpace) {
      setLoading(false)
      return
    }

    if (!user) {
      setPreferences(null)
      setLoading(false)
      return
    }

    if (!currentSpace) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (data) {
        // Update the space_id to current space if different
        if (data.space_id !== currentSpace.id) {
          const { data: updatedData, error: updateError } = await supabase
            .from('user_preferences')
            .update({ space_id: currentSpace.id })
            .eq('user_id', user.id)
            .select()
            .single()

          if (updateError) throw updateError
          setPreferences(updatedData)
        } else {
          setPreferences(data)
        }
      } else {
        // Create default preferences if none exist
        const defaultPrefs = {
          user_id: user.id,
          space_id: currentSpace.id,
          measurement_system: 'metric' as MeasurementSystem,
          fraction_display: true
        }

        const { data: newPrefs, error: createError } = await supabase
          .from('user_preferences')
          .upsert(defaultPrefs, { onConflict: 'user_id' })
          .select()
          .single()

        if (createError) throw createError
        setPreferences(newPrefs)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<Pick<UserPreferences, 'measurement_system' | 'fraction_display'>>) => {
    if (!user || !preferences) return

    try {
      const { data, error: updateError } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      setPreferences(data)
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchPreferences()
  }, [user?.id, currentSpace?.id])

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refetch: fetchPreferences
  }
}