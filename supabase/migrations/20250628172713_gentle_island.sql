/*
  # Ensure Default Space for Users

  1. Function to ensure users have a default space
  2. Trigger to create default space on user creation
  3. Migration to create spaces for existing users without spaces
*/

-- Function to ensure user has a default space
CREATE OR REPLACE FUNCTION ensure_user_has_default_space()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  space_id uuid;
  user_id uuid := auth.uid();
BEGIN
  -- Check if user has any space (as owner or member)
  SELECT s.id INTO space_id
  FROM spaces s
  WHERE s.owner_id = user_id
  LIMIT 1;
  
  -- If no owned space, check if user is a member of any space
  IF space_id IS NULL THEN
    SELECT s.id INTO space_id
    FROM spaces s
    JOIN space_members sm ON s.id = sm.space_id
    WHERE sm.user_id = user_id
    LIMIT 1;
  END IF;
  
  -- If still no space found, create a default one
  IF space_id IS NULL THEN
    INSERT INTO spaces (owner_id, name)
    VALUES (user_id, 'My Recipe Space')
    RETURNING id INTO space_id;
  END IF;
  
  RETURN space_id;
END;
$$;

-- Create default spaces for existing users who don't have any
DO $$
DECLARE
  user_record RECORD;
  default_space_id uuid;
BEGIN
  -- Find users who don't own any spaces and aren't members of any spaces
  FOR user_record IN 
    SELECT DISTINCT u.id as user_id
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM spaces s WHERE s.owner_id = u.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM space_members sm WHERE sm.user_id = u.id
    )
    AND EXISTS (
      -- Only for users who have recipes, meal plans, or preferences
      SELECT 1 FROM recipes r WHERE r.user_id = u.id
      UNION
      SELECT 1 FROM meal_plans mp WHERE mp.user_id = u.id
      UNION
      SELECT 1 FROM user_preferences up WHERE up.user_id = u.id
    )
  LOOP
    -- Create default space for user
    INSERT INTO spaces (owner_id, name)
    VALUES (user_record.user_id, 'My Recipe Space')
    RETURNING id INTO default_space_id;
    
    -- Update existing data to use the new space
    UPDATE recipes 
    SET space_id = default_space_id 
    WHERE user_id = user_record.user_id AND space_id IS NULL;
    
    UPDATE meal_plans 
    SET space_id = default_space_id 
    WHERE user_id = user_record.user_id AND space_id IS NULL;
    
    UPDATE user_preferences 
    SET space_id = default_space_id 
    WHERE user_id = user_record.user_id AND space_id IS NULL;
  END LOOP;
END $$;