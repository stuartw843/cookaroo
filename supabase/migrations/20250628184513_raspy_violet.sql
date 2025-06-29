/*
  # Fix invite code encoding issue

  1. Problem
    - The space_invites table uses 'base64url' encoding which is not supported by PostgreSQL
    - This causes errors when querying the space_invites table

  2. Solution
    - Change the default value to use 'base64' encoding instead
    - Create a custom function to make base64 output URL-safe by replacing problematic characters
    - Update the column default to use this new approach

  3. Changes
    - Create a function to generate URL-safe invite codes
    - Update the invite_code column default to use the new function
*/

-- Create a function to generate URL-safe invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text AS $$
BEGIN
  -- Generate base64 encoded random bytes and make them URL-safe
  -- Replace '+' with '-', '/' with '_', and remove '=' padding
  RETURN translate(
    rtrim(encode(gen_random_bytes(16), 'base64'), '='),
    '+/',
    '-_'
  );
END;
$$ LANGUAGE plpgsql;

-- Update the space_invites table to use the new function
ALTER TABLE space_invites 
ALTER COLUMN invite_code 
SET DEFAULT generate_invite_code();

-- Update any existing records that might have problematic invite codes
-- (This is safe because we're just regenerating the codes)
UPDATE space_invites 
SET invite_code = generate_invite_code()
WHERE invite_code IS NULL OR invite_code = '';