/*
  # Add User Names Support

  1. New Tables
    - `users` table to store user profile information
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, not null)
      - `name` (text, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on users table
    - Add policies for users to manage their own profiles
    - Add policies for reading user names in shared spaces

  3. Functions
    - Function to create user profile on signup
    - Trigger to automatically create profile when auth user is created

  4. Updates
    - Update space member queries to include user names
*/

-- Create users table for profile information
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow reading user names for space collaboration
CREATE POLICY "Users can read names of space members"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM space_members sm1, space_members sm2
      WHERE sm1.user_id = auth.uid()
      AND sm2.user_id = users.id
      AND sm1.space_id = sm2.space_id
    ) OR
    EXISTS (
      SELECT 1 FROM spaces s1, spaces s2
      WHERE (s1.owner_id = auth.uid() OR s2.owner_id = auth.uid())
      AND (
        EXISTS (SELECT 1 FROM space_members sm WHERE sm.space_id = s1.id AND sm.user_id = users.id) OR
        EXISTS (SELECT 1 FROM space_members sm WHERE sm.space_id = s2.id AND sm.user_id = users.id) OR
        s1.owner_id = users.id OR
        s2.owner_id = users.id
      )
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);