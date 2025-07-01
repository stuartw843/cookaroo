import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  initialLoad: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  deleteAccount: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      setInitialLoad(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Only handle redirects for actual auth events, not initial session load
        if (!initialLoad) {
          if (event === 'SIGNED_IN' && session?.user) {
            // Don't auto-redirect on sign in - let the auth page handle it with proper state
            console.log('User signed in, auth page will handle redirect')
          }
          
          if (event === 'SIGNED_OUT') {
            // Only redirect if we're in the app
            if (window.location.pathname.startsWith('/app') || window.location.pathname.startsWith('/join')) {
              window.location.href = '/'
            }
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async (email: string, password: string, name?: string) => {
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email)
  }

  const deleteAccount = async () => {
    try {
      // Call the database function to delete all user data
      const { error } = await supabase.rpc('delete_user_account')
      
      if (error) {
        console.error('Error deleting account:', error)
        return { error }
      }

      // Explicitly sign out and clear local session
      await supabase.auth.signOut()
      
      // Clear local state immediately
      setUser(null)
      setSession(null)
      
      // Redirect to home page
      window.location.href = '/'
      
      return { error: null }
    } catch (error) {
      console.error('Error deleting account:', error)
      return { error }
    }
  }

  const value = {
    user,
    session,
    loading,
    initialLoad,
    signIn,
    signUp,
    signOut,
    resetPassword,
    deleteAccount
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
