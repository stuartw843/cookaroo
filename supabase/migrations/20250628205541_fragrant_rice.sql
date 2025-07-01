/*
  # Fix Space Invite RLS Policies

  1. Problem
    - Users cannot join spaces via invite because RLS policies prevent adding themselves to space_members
    - The current policies require admin access to add members, but invited users don't have access yet

  2. Solution
    - Add special policies for invite-based member addition
    - Allow users to add themselves to spaces when they have a valid invite
    - Update existing policies to handle invite scenarios

  3. Changes
    - Add policy for invite-based member insertion
    - Update existing policies to be more permissive for valid invite scenarios
*/

-- Drop existing restrictive policies for space_members
DROP POLICY IF EXISTS "Space admins can manage members" ON space_members;
DROP POLICY IF EXISTS "Users can read members of spaces they have access to" ON space_members;

-- Create more granular policies for space_members

-- Allow reading members if user has space access OR if checking via valid invite
CREATE POLICY "Users can read space members with access or valid invite"
  ON space_members
  FOR SELECT
  TO authenticated
  USING (
    user_has_space_access(space_id) OR
    EXISTS (
      SELECT 1 FROM space_invites si
      WHERE si.space_id = space_members.space_id
      AND si.is_active = true
      AND si.expires_at > now()
      AND (si.max_uses IS NULL OR si.current_uses < si.max_uses)
    )
  );

-- Allow space admins to manage members (existing functionality)
CREATE POLICY "Space admins can manage members"
  ON space_members
  FOR ALL
  TO authenticated
  USING (user_has_space_access(space_id, 'admin'))
  WITH CHECK (user_has_space_access(space_id, 'admin'));

-- Special policy for invite-based member addition
CREATE POLICY "Users can join spaces with valid invites"
  ON space_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    role = 'member' AND
    EXISTS (
      SELECT 1 FROM space_invites si
      WHERE si.space_id = space_members.space_id
      AND si.is_active = true
      AND si.expires_at > now()
      AND (si.max_uses IS NULL OR si.current_uses < si.max_uses)
    )
  );

-- Update space_invites policies to be more permissive for reading
DROP POLICY IF EXISTS "Anyone can read active invites for joining" ON space_invites;

CREATE POLICY "Anyone can read valid invites for joining"
  ON space_invites
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND 
    expires_at > now() AND
    (max_uses IS NULL OR current_uses < max_uses)
  );

-- Keep existing admin policy for space_invites management
-- (This should already exist, but ensure it's there)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'space_invites' 
    AND policyname = 'Space admins can manage invites'
  ) THEN
    CREATE POLICY "Space admins can manage invites"
      ON space_invites
      FOR ALL
      TO authenticated
      USING (user_has_space_access(space_id, 'admin'))
      WITH CHECK (user_has_space_access(space_id, 'admin'));
  END IF;
END $$;

-- Also ensure spaces can be read by users checking invites
DROP POLICY IF EXISTS "Users can read spaces they have access to" ON spaces;

CREATE POLICY "Users can read spaces they have access to or via valid invite"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM space_members 
      WHERE space_id = spaces.id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM space_invites si
      WHERE si.space_id = spaces.id
      AND si.is_active = true
      AND si.expires_at > now()
      AND (si.max_uses IS NULL OR si.current_uses < si.max_uses)
    )
  );

-- Keep other space policies as they are
-- (These should already exist and work correctly)