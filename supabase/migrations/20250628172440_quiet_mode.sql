/*
  # Remove space owners from members table

  1. Changes
    - Remove space owners from space_members table to avoid double counting
    - Update get_user_default_space function to not add owner as member
    - Clean up existing data where owners are also members

  2. Security
    - Maintains existing RLS policies
    - Owners still have admin access through ownership, not membership
*/

-- Remove owners from space_members table to avoid double counting
DELETE FROM space_members 
WHERE (space_id, user_id) IN (
  SELECT s.id, s.owner_id 
  FROM spaces s 
  WHERE s.owner_id = space_members.user_id 
  AND s.id = space_members.space_id
);

-- Update the get_user_default_space function to not add owner as member
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
    VALUES (auth.uid(), 'My Recipe Space')
    RETURNING id INTO space_id;
    
    -- Note: Owner is NOT added to space_members table
    -- They have admin access through ownership
  END IF;
  
  RETURN space_id;
END;
$$;