/*
  # Fix Public Access to Space Invites

  1. Problem
    - The space_invites RLS policy only allows authenticated users to read invites
    - This prevents unauthenticated users from validating invite links
    - Results in 406 (Not Acceptable) errors when accessing join links while not logged in

  2. Solution
    - Update the RLS policy to allow public (unauthenticated) access for reading active invites
    - This enables invite link validation before authentication
    - Maintains security by only exposing active, non-expired invites

  3. Changes
    - Drop the existing restrictive policy
    - Create a new policy that allows public read access to active invites
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can read active invites for joining" ON space_invites;

-- Create a new policy that allows public access to active invites
CREATE POLICY "Public can read active invites for validation"
  ON space_invites
  FOR SELECT
  USING (is_active = true AND expires_at > now());

-- Keep the existing admin policy for managing invites
-- (This policy already exists and doesn't need to be changed)
