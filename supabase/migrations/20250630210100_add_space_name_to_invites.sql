/*
  # Add space_name to space_invites table

  1. Problem
    - JoinSpace component needs to JOIN space_invites with spaces table to get space name
    - This requires public access to spaces table for unauthenticated invite validation
    - Creates unnecessary complexity and security concerns

  2. Solution
    - Add space_name column directly to space_invites table
    - Populate existing invites with space names
    - Update invite creation to include space name
    - Remove need for JOIN in invite validation

  3. Changes
    - Add space_name column to space_invites
    - Populate existing invites with space names from spaces table
    - Create trigger to auto-populate space_name on insert
*/

-- Add space_name column to space_invites table
ALTER TABLE space_invites 
ADD COLUMN space_name TEXT;

-- Populate existing invites with space names
UPDATE space_invites 
SET space_name = spaces.name
FROM spaces 
WHERE space_invites.space_id = spaces.id;

-- Make space_name NOT NULL for future inserts
ALTER TABLE space_invites 
ALTER COLUMN space_name SET NOT NULL;

-- Create a trigger function to auto-populate space_name when creating invites
CREATE OR REPLACE FUNCTION populate_invite_space_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the space name and set it on the invite
  SELECT name INTO NEW.space_name
  FROM spaces
  WHERE id = NEW.space_id;
  
  -- If space not found, raise an error
  IF NEW.space_name IS NULL THEN
    RAISE EXCEPTION 'Space with id % not found', NEW.space_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate space_name on insert
DROP TRIGGER IF EXISTS populate_space_name_trigger ON space_invites;
CREATE TRIGGER populate_space_name_trigger
  BEFORE INSERT ON space_invites
  FOR EACH ROW
  EXECUTE FUNCTION populate_invite_space_name();
