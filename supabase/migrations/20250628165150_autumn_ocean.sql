/*
  # Collaboration System with Invite Links

  1. New Tables
    - `spaces` - User workspaces/recipe collections
    - `space_members` - Members of each space
    - `space_invites` - Invite links with expiration

  2. Updates
    - Update existing tables to reference spaces instead of users directly
    - Add space_id to recipes, meal_plans, user_preferences

  3. Security
    - Enable RLS on all new tables
    - Update existing policies to work with spaces
    - Add policies for space-based access control

  4. Functions
    - Function to check space access
    - Function to handle invite acceptance
*/

-- Create spaces table
CREATE TABLE IF NOT EXISTS spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Recipe Space',
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create space_members table
CREATE TABLE IF NOT EXISTS space_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(space_id, user_id)
);

-- Create space_invites table
CREATE TABLE IF NOT EXISTS space_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'base64url'),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  max_uses integer DEFAULT NULL,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add space_id to existing tables
DO $$
BEGIN
  -- Add space_id to recipes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recipes' AND column_name = 'space_id'
  ) THEN
    ALTER TABLE recipes ADD COLUMN space_id uuid REFERENCES spaces(id) ON DELETE CASCADE;
  END IF;

  -- Add space_id to meal_plans if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'space_id'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN space_id uuid REFERENCES spaces(id) ON DELETE CASCADE;
  END IF;

  -- Add space_id to user_preferences if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' AND column_name = 'space_id'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN space_id uuid REFERENCES spaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_spaces_owner_id ON spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_space_members_space_id ON space_members(space_id);
CREATE INDEX IF NOT EXISTS idx_space_members_user_id ON space_members(user_id);
CREATE INDEX IF NOT EXISTS idx_space_invites_space_id ON space_invites(space_id);
CREATE INDEX IF NOT EXISTS idx_space_invites_code ON space_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_space_invites_expires_at ON space_invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_recipes_space_id ON recipes(space_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_space_id ON meal_plans(space_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_space_id ON user_preferences(space_id);

-- Enable RLS
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_invites ENABLE ROW LEVEL SECURITY;

-- Function to check if user has access to a space
CREATE OR REPLACE FUNCTION user_has_space_access(target_space_id uuid, required_role text DEFAULT 'member')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is owner
  IF EXISTS (
    SELECT 1 FROM spaces 
    WHERE id = target_space_id AND owner_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user is a member with required role
  IF required_role = 'admin' THEN
    RETURN EXISTS (
      SELECT 1 FROM space_members 
      WHERE space_id = target_space_id 
      AND user_id = auth.uid() 
      AND role = 'admin'
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM space_members 
      WHERE space_id = target_space_id 
      AND user_id = auth.uid()
    );
  END IF;
END;
$$;

-- Function to get user's default space (creates one if none exists)
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
    
    -- Add owner as admin member
    INSERT INTO space_members (space_id, user_id, role)
    VALUES (space_id, auth.uid(), 'admin');
  END IF;
  
  RETURN space_id;
END;
$$;

-- Policies for spaces
CREATE POLICY "Users can read spaces they have access to"
  ON spaces
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM space_members 
      WHERE space_id = spaces.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own spaces"
  ON spaces
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Space owners can update their spaces"
  ON spaces
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Space owners can delete their spaces"
  ON spaces
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Policies for space_members
CREATE POLICY "Users can read members of spaces they have access to"
  ON space_members
  FOR SELECT
  TO authenticated
  USING (user_has_space_access(space_id));

CREATE POLICY "Space admins can manage members"
  ON space_members
  FOR ALL
  TO authenticated
  USING (user_has_space_access(space_id, 'admin'))
  WITH CHECK (user_has_space_access(space_id, 'admin'));

-- Policies for space_invites
CREATE POLICY "Space admins can manage invites"
  ON space_invites
  FOR ALL
  TO authenticated
  USING (user_has_space_access(space_id, 'admin'))
  WITH CHECK (user_has_space_access(space_id, 'admin'));

CREATE POLICY "Anyone can read active invites for joining"
  ON space_invites
  FOR SELECT
  TO authenticated
  USING (is_active = true AND expires_at > now());

-- Update existing policies to use spaces

-- Update recipes policies
DROP POLICY IF EXISTS "Users can read accessible recipes" ON recipes;
CREATE POLICY "Users can read recipes in accessible spaces"
  ON recipes
  FOR SELECT
  TO authenticated
  USING (user_has_space_access(space_id));

DROP POLICY IF EXISTS "Users can insert accessible recipes" ON recipes;
CREATE POLICY "Users can insert recipes in accessible spaces"
  ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_has_space_access(space_id));

DROP POLICY IF EXISTS "Users can update accessible recipes" ON recipes;
CREATE POLICY "Users can update recipes in accessible spaces"
  ON recipes
  FOR UPDATE
  TO authenticated
  USING (user_has_space_access(space_id))
  WITH CHECK (user_has_space_access(space_id));

DROP POLICY IF EXISTS "Users can delete accessible recipes" ON recipes;
CREATE POLICY "Users can delete recipes in accessible spaces"
  ON recipes
  FOR DELETE
  TO authenticated
  USING (user_has_space_access(space_id));

-- Update ingredients policies
DROP POLICY IF EXISTS "Users can read accessible recipe ingredients" ON ingredients;
CREATE POLICY "Users can read ingredients in accessible spaces"
  ON ingredients
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = ingredients.recipe_id
    AND user_has_space_access(recipes.space_id)
  ));

DROP POLICY IF EXISTS "Users can insert accessible recipe ingredients" ON ingredients;
CREATE POLICY "Users can insert ingredients in accessible spaces"
  ON ingredients
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = ingredients.recipe_id
    AND user_has_space_access(recipes.space_id)
  ));

DROP POLICY IF EXISTS "Users can update accessible recipe ingredients" ON ingredients;
CREATE POLICY "Users can update ingredients in accessible spaces"
  ON ingredients
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = ingredients.recipe_id
    AND user_has_space_access(recipes.space_id)
  ));

DROP POLICY IF EXISTS "Users can delete accessible recipe ingredients" ON ingredients;
CREATE POLICY "Users can delete ingredients in accessible spaces"
  ON ingredients
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = ingredients.recipe_id
    AND user_has_space_access(recipes.space_id)
  ));

-- Update instructions policies
DROP POLICY IF EXISTS "Users can read accessible recipe instructions" ON instructions;
CREATE POLICY "Users can read instructions in accessible spaces"
  ON instructions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = instructions.recipe_id
    AND user_has_space_access(recipes.space_id)
  ));

DROP POLICY IF EXISTS "Users can insert accessible recipe instructions" ON instructions;
CREATE POLICY "Users can insert instructions in accessible spaces"
  ON instructions
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = instructions.recipe_id
    AND user_has_space_access(recipes.space_id)
  ));

DROP POLICY IF EXISTS "Users can update accessible recipe instructions" ON instructions;
CREATE POLICY "Users can update instructions in accessible spaces"
  ON instructions
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = instructions.recipe_id
    AND user_has_space_access(recipes.space_id)
  ));

DROP POLICY IF EXISTS "Users can delete accessible recipe instructions" ON instructions;
CREATE POLICY "Users can delete instructions in accessible spaces"
  ON instructions
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = instructions.recipe_id
    AND user_has_space_access(recipes.space_id)
  ));

-- Update meal_plans policies
DROP POLICY IF EXISTS "Users can read accessible meal plans" ON meal_plans;
CREATE POLICY "Users can read meal plans in accessible spaces"
  ON meal_plans
  FOR SELECT
  TO authenticated
  USING (user_has_space_access(space_id));

DROP POLICY IF EXISTS "Users can insert accessible meal plans" ON meal_plans;
CREATE POLICY "Users can insert meal plans in accessible spaces"
  ON meal_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (user_has_space_access(space_id));

DROP POLICY IF EXISTS "Users can update accessible meal plans" ON meal_plans;
CREATE POLICY "Users can update meal plans in accessible spaces"
  ON meal_plans
  FOR UPDATE
  TO authenticated
  USING (user_has_space_access(space_id))
  WITH CHECK (user_has_space_access(space_id));

DROP POLICY IF EXISTS "Users can delete accessible meal plans" ON meal_plans;
CREATE POLICY "Users can delete meal plans in accessible spaces"
  ON meal_plans
  FOR DELETE
  TO authenticated
  USING (user_has_space_access(space_id));

-- Update meal_plan_items policies
DROP POLICY IF EXISTS "Users can read accessible meal plan items" ON meal_plan_items;
CREATE POLICY "Users can read meal plan items in accessible spaces"
  ON meal_plan_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND user_has_space_access(meal_plans.space_id)
  ));

DROP POLICY IF EXISTS "Users can insert accessible meal plan items" ON meal_plan_items;
CREATE POLICY "Users can insert meal plan items in accessible spaces"
  ON meal_plan_items
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND user_has_space_access(meal_plans.space_id)
  ));

DROP POLICY IF EXISTS "Users can update accessible meal plan items" ON meal_plan_items;
CREATE POLICY "Users can update meal plan items in accessible spaces"
  ON meal_plan_items
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND user_has_space_access(meal_plans.space_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND user_has_space_access(meal_plans.space_id)
  ));

DROP POLICY IF EXISTS "Users can delete accessible meal plan items" ON meal_plan_items;
CREATE POLICY "Users can delete meal plan items in accessible spaces"
  ON meal_plan_items
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND user_has_space_access(meal_plans.space_id)
  ));

-- Update user_preferences policies
DROP POLICY IF EXISTS "Users can read own preferences" ON user_preferences;
CREATE POLICY "Users can read preferences in accessible spaces"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_has_space_access(space_id));

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert preferences in accessible spaces"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND (space_id IS NULL OR user_has_space_access(space_id)));

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update preferences in accessible spaces"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND (space_id IS NULL OR user_has_space_access(space_id)))
  WITH CHECK (user_id = auth.uid() AND (space_id IS NULL OR user_has_space_access(space_id)));

-- Add triggers for updated_at
CREATE TRIGGER update_spaces_updated_at
  BEFORE UPDATE ON spaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration function to assign existing data to default spaces
CREATE OR REPLACE FUNCTION migrate_existing_data_to_spaces()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  default_space_id uuid;
BEGIN
  -- For each user with existing data, create a default space and migrate their data
  FOR user_record IN 
    SELECT DISTINCT user_id FROM recipes 
    WHERE space_id IS NULL
    UNION
    SELECT DISTINCT user_id FROM meal_plans 
    WHERE space_id IS NULL
    UNION
    SELECT DISTINCT user_id FROM user_preferences 
    WHERE space_id IS NULL
  LOOP
    -- Create default space for user
    INSERT INTO spaces (owner_id, name)
    VALUES (user_record.user_id, 'My Recipe Space')
    RETURNING id INTO default_space_id;
    
    -- Add user as admin member
    INSERT INTO space_members (space_id, user_id, role)
    VALUES (default_space_id, user_record.user_id, 'admin')
    ON CONFLICT (space_id, user_id) DO NOTHING;
    
    -- Migrate recipes
    UPDATE recipes 
    SET space_id = default_space_id 
    WHERE user_id = user_record.user_id AND space_id IS NULL;
    
    -- Migrate meal plans
    UPDATE meal_plans 
    SET space_id = default_space_id 
    WHERE user_id = user_record.user_id AND space_id IS NULL;
    
    -- Migrate user preferences
    UPDATE user_preferences 
    SET space_id = default_space_id 
    WHERE user_id = user_record.user_id AND space_id IS NULL;
  END LOOP;
END;
$$;

-- Run the migration
SELECT migrate_existing_data_to_spaces();

-- Drop the migration function as it's no longer needed
DROP FUNCTION migrate_existing_data_to_spaces();