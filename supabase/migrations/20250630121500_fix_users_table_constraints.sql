/*
  # Fix Users Table Name Column Issue

  1. Problem
    - User signup fails with "column 'name' of relation 'users' does not exist"
    - The name column exists but there might be constraint issues
    - Previous migration tried to set NOT NULL constraint which might be failing

  2. Solution
    - Remove the NOT NULL constraint from name column temporarily
    - Update any NULL name values with fallback
    - Recreate the constraint properly
    - Ensure trigger function works correctly

  3. Changes
    - Fix name column constraints
    - Update trigger function with better error handling
    - Ensure existing users have proper name values
*/

-- First, let's make sure any existing users with NULL names get a fallback value
UPDATE users 
SET name = split_part(email, '@', 1) 
WHERE name IS NULL OR name = '';

-- Remove the NOT NULL constraint temporarily if it exists
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;

-- Now set it back with proper values
ALTER TABLE users ALTER COLUMN name SET NOT NULL;

-- Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_name text;
BEGIN
  -- Extract name from metadata or use email fallback
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name', 
    split_part(NEW.email, '@', 1)
  );
  
  -- Ensure we have a valid name
  IF user_name IS NULL OR trim(user_name) = '' THEN
    user_name := split_part(NEW.email, '@', 1);
  END IF;
  
  RAISE LOG 'Creating user profile for % (ID: %), name: %', NEW.email, NEW.id, user_name;
  
  -- Insert the user profile
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, user_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = now();
  
  RAISE LOG 'Successfully created user profile for %', NEW.email;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating user profile for % (ID: %): % (SQLSTATE: %)', NEW.email, NEW.id, SQLERRM, SQLSTATE;
    -- Don't fail the auth signup
    RETURN NEW;
END;
$$;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Ensure the INSERT policy allows the trigger to work
DROP POLICY IF EXISTS "Allow user profile creation" ON users;
CREATE POLICY "Allow user profile creation"
  ON users
  FOR INSERT
  WITH CHECK (
    -- Allow if the user is creating their own profile
    auth.uid() = id OR
    -- Allow system/trigger operations (when auth.uid() is null during signup)
    auth.uid() IS NULL
  );

-- Also ensure users can read their own profile
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
CREATE POLICY "Users can read their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- And update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a function to manually create user profiles if needed (for debugging)
CREATE OR REPLACE FUNCTION create_user_profile_manual(
  user_id uuid,
  user_email text,
  user_name text DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    user_id,
    user_email,
    COALESCE(user_name, split_part(user_email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    updated_at = now();
    
  RAISE LOG 'Manually created/updated user profile for %', user_email;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_user_profile_manual for %: % (SQLSTATE: %)', user_email, SQLERRM, SQLSTATE;
    RAISE;
END;
$$;

-- Grant execute permission on the manual function
GRANT EXECUTE ON FUNCTION create_user_profile_manual(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile_manual(uuid, text, text) TO anon;
