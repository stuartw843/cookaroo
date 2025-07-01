/*
  # Fix space_members and users relationship

  1. Problem
    - The space_members table references auth.users but the query is trying to join with public.users
    - Need to add foreign key relationship between space_members and public.users

  2. Solution
    - Add foreign key constraint from space_members.user_id to public.users.id
    - Ensure all existing space_members have corresponding users in public.users table

  3. Changes
    - Create missing user records in public.users for existing space_members
    - Add foreign key constraint between space_members and public.users
*/

-- First, ensure all users referenced in space_members exist in public.users
INSERT INTO public.users (id, email, name)
SELECT DISTINCT 
  sm.user_id,
  COALESCE(au.email, 'unknown@example.com'),
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
FROM space_members sm
LEFT JOIN auth.users au ON au.id = sm.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = sm.user_id
)
ON CONFLICT (id) DO NOTHING;

-- Also ensure all users referenced in other tables exist in public.users
INSERT INTO public.users (id, email, name)
SELECT DISTINCT 
  r.user_id,
  COALESCE(au.email, 'unknown@example.com'),
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
FROM recipes r
LEFT JOIN auth.users au ON au.id = r.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = r.user_id
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, name)
SELECT DISTINCT 
  mp.user_id,
  COALESCE(au.email, 'unknown@example.com'),
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
FROM meal_plans mp
LEFT JOIN auth.users au ON au.id = mp.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = mp.user_id
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, name)
SELECT DISTINCT 
  s.owner_id,
  COALESCE(au.email, 'unknown@example.com'),
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
FROM spaces s
LEFT JOIN auth.users au ON au.id = s.owner_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = s.owner_id
)
ON CONFLICT (id) DO NOTHING;

-- Now add the foreign key constraint between space_members and public.users
DO $$
BEGIN
  -- Check if the foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'space_members_user_id_fkey_public'
  ) THEN
    -- Add foreign key constraint to public.users
    ALTER TABLE space_members 
    ADD CONSTRAINT space_members_user_id_fkey_public 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;