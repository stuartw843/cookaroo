/*
  # Create Default "My Recipes" Space for New Users

  1. Changes
    - Update the get_user_default_space function to create "My Recipes" space
    - Create a trigger to automatically create default space on user signup
    - Update the user creation trigger to also create the default space

  2. Security
    - Maintains existing RLS policies
    - Ensures new users always have a default space to work with
*/

-- Update the get_user_default_space function to create "My Recipes" space
CREATE OR REPLACE FUNCTION get_user_default_space()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  space_id uuid;
BEGIN
  -- Try to find existing space where user is owner
  SELECT id INTO space_id
  FROM spaces
  WHERE owner_id = auth.uid()
  LIMIT 1;
  
  -- If no space found, create one
  IF space_id IS NULL THEN
    INSERT INTO spaces (owner_id, name)
    VALUES (auth.uid(), 'My Recipes')
    RETURNING id INTO space_id;
    
    -- Note: Owner is NOT added to space_members table
    -- They have admin access through ownership
  END IF;
  
  RETURN space_id;
END;
$$;

-- Create a function to create default space for new users
CREATE OR REPLACE FUNCTION create_default_space_for_user(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  space_id uuid;
BEGIN
  -- Check if user already has a space
  SELECT id INTO space_id
  FROM spaces
  WHERE owner_id = user_id
  LIMIT 1;
  
  -- If no space found, create the default "My Recipes" space
  IF space_id IS NULL THEN
    INSERT INTO spaces (owner_id, name)
    VALUES (user_id, 'My Recipes')
    RETURNING id INTO space_id;
    
    RAISE LOG 'Created default "My Recipes" space (ID: %) for user %', space_id, user_id;
  ELSE
    RAISE LOG 'User % already has a space (ID: %), skipping default space creation', user_id, space_id;
  END IF;
  
  RETURN space_id;
END;
$$;

-- Update the handle_new_user function to also create default space
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_name text;
  default_space_id uuid;
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
  
  -- Create default "My Recipes" space for the new user
  BEGIN
    default_space_id := create_default_space_for_user(NEW.id);
    RAISE LOG 'Successfully created default space (ID: %) for user %', default_space_id, NEW.email;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error creating default space for % (ID: %): % (SQLSTATE: %)', NEW.email, NEW.id, SQLERRM, SQLSTATE;
      -- Don't fail the signup if space creation fails
  END;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for % (ID: %): % (SQLSTATE: %)', NEW.email, NEW.id, SQLERRM, SQLSTATE;
    -- Don't fail the auth signup
    RETURN NEW;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_default_space_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_space_for_user(uuid) TO anon;

-- Update existing spaces named "My Recipe Space" to "My Recipes" for consistency
UPDATE spaces 
SET name = 'My Recipes', updated_at = now()
WHERE name = 'My Recipe Space';

-- Create a function to manually create default spaces for existing users who don't have one
CREATE OR REPLACE FUNCTION create_missing_default_spaces()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  space_id uuid;
BEGIN
  -- Find users who don't have any spaces
  FOR user_record IN 
    SELECT u.id, u.email
    FROM users u
    LEFT JOIN spaces s ON s.owner_id = u.id
    WHERE s.id IS NULL
  LOOP
    BEGIN
      space_id := create_default_space_for_user(user_record.id);
      RAISE LOG 'Created missing default space (ID: %) for existing user %', space_id, user_record.email;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error creating missing default space for user % (ID: %): % (SQLSTATE: %)', user_record.email, user_record.id, SQLERRM, SQLSTATE;
    END;
  END LOOP;
END;
$$;

-- Run the function to create missing default spaces for existing users
SELECT create_missing_default_spaces();

-- Drop the temporary function
DROP FUNCTION create_missing_default_spaces();
