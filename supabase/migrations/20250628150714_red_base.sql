/*
  # Create user_invites table

  1. New Tables
    - `user_invites`
      - `id` (uuid, primary key)
      - `email` (text, not null)
      - `invited_by` (uuid, foreign key to auth.users)
      - `invited_user_id` (uuid, foreign key to auth.users, nullable)
      - `status` (text, default 'pending')
      - `created_at` (timestamptz, default now())
      - `accepted_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `user_invites` table
    - Add policies for users to manage their own invites
    - Add policies for users to see and accept invites sent to them

  3. Constraints
    - Unique constraint on (email, invited_by)
    - Check constraint on status values
    - Foreign key constraints to auth.users

  4. Indexes
    - Index on email for faster lookups
    - Index on invited_by for performance
    - Index on status for filtering
*/

-- Create the user_invites table
CREATE TABLE IF NOT EXISTS user_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invited_by uuid NOT NULL,
  invited_user_id uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

-- Add constraints using DO blocks to handle existing constraints
DO $$
BEGIN
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_invites_email_invited_by_key'
  ) THEN
    ALTER TABLE user_invites 
    ADD CONSTRAINT user_invites_email_invited_by_key 
    UNIQUE (email, invited_by);
  END IF;

  -- Add status check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_invites_status_check'
  ) THEN
    ALTER TABLE user_invites 
    ADD CONSTRAINT user_invites_status_check 
    CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text]));
  END IF;

  -- Add foreign key constraint for invited_by if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_invites_invited_by_fkey'
  ) THEN
    ALTER TABLE user_invites 
    ADD CONSTRAINT user_invites_invited_by_fkey 
    FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key constraint for invited_user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_invites_invited_user_id_fkey'
  ) THEN
    ALTER TABLE user_invites 
    ADD CONSTRAINT user_invites_invited_user_id_fkey 
    FOREIGN KEY (invited_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_invites_email ON user_invites USING btree (email);
CREATE INDEX IF NOT EXISTS idx_user_invites_invited_by ON user_invites USING btree (invited_by);
CREATE INDEX IF NOT EXISTS idx_user_invites_status ON user_invites USING btree (status);

-- Enable Row Level Security
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can manage their own invites" ON user_invites;
  DROP POLICY IF EXISTS "Users can see invites sent to them" ON user_invites;
  DROP POLICY IF EXISTS "Users can accept invites sent to them" ON user_invites;
END $$;

-- Create RLS policies

-- Users can manage their own invites (all operations)
CREATE POLICY "Users can manage their own invites"
  ON user_invites
  FOR ALL
  TO authenticated
  USING (auth.uid() = invited_by);

-- Users can see invites sent to them or that they've accepted
CREATE POLICY "Users can see invites sent to them"
  ON user_invites
  FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = invited_user_id::text 
    OR email = auth.email()
  );

-- Users can accept invites sent to them
CREATE POLICY "Users can accept invites sent to them"
  ON user_invites
  FOR UPDATE
  TO authenticated
  USING (
    email = auth.email() 
    AND status = 'pending'
  );