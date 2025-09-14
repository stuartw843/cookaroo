import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      spaces: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      space_members: {
        Row: {
          id: string
          space_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          space_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      space_invites: {
        Row: {
          id: string
          space_id: string
          invite_code: string
          created_by: string
          expires_at: string
          max_uses: number | null
          current_uses: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          space_id: string
          invite_code?: string
          created_by: string
          expires_at?: string
          max_uses?: number | null
          current_uses?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          invite_code?: string
          created_by?: string
          expires_at?: string
          max_uses?: number | null
          current_uses?: number
          is_active?: boolean
          created_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          user_id: string
          space_id: string
          title: string
          description: string | null
          image_url: string | null
          source_url: string | null
          prep_time: number | null
          cook_time: number | null
          servings: number
          difficulty: string | null
          tags: string[]
          created_at: string
          updated_at: string
          ai_collection_id: string | null
          generation_prompt: string | null
          is_ai_generated: boolean
        }
        Insert: {
          id?: string
          user_id: string
          space_id: string
          title: string
          description?: string | null
          image_url?: string | null
          source_url?: string | null
          prep_time?: number | null
          cook_time?: number | null
          servings?: number
          difficulty?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
          ai_collection_id?: string | null
          generation_prompt?: string | null
          is_ai_generated?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          space_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          source_url?: string | null
          prep_time?: number | null
          cook_time?: number | null
          servings?: number
          difficulty?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
          ai_collection_id?: string | null
          generation_prompt?: string | null
          is_ai_generated?: boolean
        }
      }
      ingredients: {
        Row: {
          id: string
          recipe_id: string
          amount: number | null
          unit: string | null
          name: string
          preparation: string | null
          order_index: number | null
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          amount?: number | null
          unit?: string | null
          name: string
          preparation?: string | null
          order_index?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          amount?: number | null
          unit?: string | null
          name?: string
          preparation?: string | null
          order_index?: number | null
          created_at?: string
        }
      }
      instructions: {
        Row: {
          id: string
          recipe_id: string
          step_number: number
          instruction: string
          section: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          step_number: number
          instruction: string
          section?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          step_number?: number
          instruction?: string
          section?: string | null
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          space_id: string | null
          measurement_system: string
          dietary_restrictions: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          space_id?: string | null
          measurement_system?: string
          dietary_restrictions?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          space_id?: string | null
          measurement_system?: string
          dietary_restrictions?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      meal_plans: {
        Row: {
          id: string
          user_id: string
          space_id: string
          week_start_date: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          space_id: string
          week_start_date: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          space_id?: string
          week_start_date?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meal_plan_items: {
        Row: {
          id: string
          meal_plan_id: string
          day_of_week: number
          meal_type: string
          recipe_id: string | null
          custom_text: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          meal_plan_id: string
          day_of_week: number
          meal_type: string
          recipe_id?: string | null
          custom_text?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          meal_plan_id?: string
          day_of_week?: number
          meal_type?: string
          recipe_id?: string | null
          custom_text?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      ai_recipe_collections: {
        Row: {
          id: string
          space_id: string
          name: string
          system_prompt: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          space_id: string
          name: string
          system_prompt: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          name?: string
          system_prompt?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
  auth: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}