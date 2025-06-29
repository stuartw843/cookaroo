/*
  # User Invites System

  1. New Tables
    - `user_invites`
      - `id` (uuid, primary key)
      - `email` (text, email of invited user)
      - `invited_by` (uuid, references users.id)
      - `invited_user_id` (uuid, references users.id, nullable)
      - `status` (text, 'pending' or 'accepted')
      - `created_at` (timestamp)
      - `accepted_at` (timestamp, nullable)

  2. Security
    - Enable RLS on `user_invites` table
    - Add policies for users to manage their own invites
    - Add policies for invited users to see and accept their invites

  3. Functions
    - Function to check if user has access to recipes/meal plans
*/

-- Create user_invites table
CREATE TABLE IF NOT EXISTS user_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(email, invited_by)
);

-- Enable RLS
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;

-- Policies for user_invites
CREATE POLICY "Users can manage their own invites"
  ON user_invites
  FOR ALL
  TO authenticated
  USING (auth.uid() = invited_by);

CREATE POLICY "Users can see invites sent to them"
  ON user_invites
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = invited_user_id::text OR email = auth.email());

CREATE POLICY "Users can accept invites sent to them"
  ON user_invites
  FOR UPDATE
  TO authenticated
  USING (email = auth.email() AND status = 'pending');

-- Function to check if user has access to another user's data
CREATE OR REPLACE FUNCTION user_has_access(owner_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- User has access to their own data
  IF auth.uid() = owner_user_id THEN
    RETURN true;
  END IF;
  
  -- User has access if they have an accepted invite from the owner
  RETURN EXISTS (
    SELECT 1 FROM user_invites
    WHERE invited_by = owner_user_id
    AND invited_user_id = auth.uid()
    AND status = 'accepted'
  );
END;
$$;

-- Update recipes policies to include shared access
DROP POLICY IF EXISTS "Users can read own recipes" ON recipes;
CREATE POLICY "Users can read accessible recipes"
  ON recipes
  FOR SELECT
  TO authenticated
  USING (user_has_access(user_id));

DROP POLICY IF EXISTS "Users can insert own recipes" ON recipes;
CREATE POLICY "Users can insert accessible recipes"
  ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_has_access(user_id));

DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
CREATE POLICY "Users can update accessible recipes"
  ON recipes
  FOR UPDATE
  TO authenticated
  USING (user_has_access(user_id))
  WITH CHECK (user_has_access(user_id));

DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;
CREATE POLICY "Users can delete accessible recipes"
  ON recipes
  FOR DELETE
  TO authenticated
  USING (user_has_access(user_id));

-- Update ingredients policies
DROP POLICY IF EXISTS "Users can read own recipe ingredients" ON ingredients;
CREATE POLICY "Users can read accessible recipe ingredients"
  ON ingredients
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = ingredients.recipe_id
    AND user_has_access(recipes.user_id)
  ));

DROP POLICY IF EXISTS "Users can insert own recipe ingredients" ON ingredients;
CREATE POLICY "Users can insert accessible recipe ingredients"
  ON ingredients
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = ingredients.recipe_id
    AND user_has_access(recipes.user_id)
  ));

DROP POLICY IF EXISTS "Users can update own recipe ingredients" ON ingredients;
CREATE POLICY "Users can update accessible recipe ingredients"
  ON ingredients
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = ingredients.recipe_id
    AND user_has_access(recipes.user_id)
  ));

DROP POLICY IF EXISTS "Users can delete own recipe ingredients" ON ingredients;
CREATE POLICY "Users can delete accessible recipe ingredients"
  ON ingredients
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = ingredients.recipe_id
    AND user_has_access(recipes.user_id)
  ));

-- Update instructions policies
DROP POLICY IF EXISTS "Users can read own recipe instructions" ON instructions;
CREATE POLICY "Users can read accessible recipe instructions"
  ON instructions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = instructions.recipe_id
    AND user_has_access(recipes.user_id)
  ));

DROP POLICY IF EXISTS "Users can insert own recipe instructions" ON instructions;
CREATE POLICY "Users can insert accessible recipe instructions"
  ON instructions
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = instructions.recipe_id
    AND user_has_access(recipes.user_id)
  ));

DROP POLICY IF EXISTS "Users can update own recipe instructions" ON instructions;
CREATE POLICY "Users can update accessible recipe instructions"
  ON instructions
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = instructions.recipe_id
    AND user_has_access(recipes.user_id)
  ));

DROP POLICY IF EXISTS "Users can delete own recipe instructions" ON instructions;
CREATE POLICY "Users can delete accessible recipe instructions"
  ON instructions
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes
    WHERE recipes.id = instructions.recipe_id
    AND user_has_access(recipes.user_id)
  ));

-- Update meal_plans policies
DROP POLICY IF EXISTS "Users can read own meal plans" ON meal_plans;
CREATE POLICY "Users can read accessible meal plans"
  ON meal_plans
  FOR SELECT
  TO authenticated
  USING (user_has_access(user_id));

DROP POLICY IF EXISTS "Users can insert own meal plans" ON meal_plans;
CREATE POLICY "Users can insert accessible meal plans"
  ON meal_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (user_has_access(user_id));

DROP POLICY IF EXISTS "Users can update own meal plans" ON meal_plans;
CREATE POLICY "Users can update accessible meal plans"
  ON meal_plans
  FOR UPDATE
  TO authenticated
  USING (user_has_access(user_id))
  WITH CHECK (user_has_access(user_id));

DROP POLICY IF EXISTS "Users can delete own meal plans" ON meal_plans;
CREATE POLICY "Users can delete accessible meal plans"
  ON meal_plans
  FOR DELETE
  TO authenticated
  USING (user_has_access(user_id));

-- Update meal_plan_items policies
DROP POLICY IF EXISTS "Users can read own meal plan items" ON meal_plan_items;
CREATE POLICY "Users can read accessible meal plan items"
  ON meal_plan_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND user_has_access(meal_plans.user_id)
  ));

DROP POLICY IF EXISTS "Users can insert own meal plan items" ON meal_plan_items;
CREATE POLICY "Users can insert accessible meal plan items"
  ON meal_plan_items
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND user_has_access(meal_plans.user_id)
  ));

DROP POLICY IF EXISTS "Users can update own meal plan items" ON meal_plan_items;
CREATE POLICY "Users can update accessible meal plan items"
  ON meal_plan_items
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND user_has_access(meal_plans.user_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND user_has_access(meal_plans.user_id)
  ));

DROP POLICY IF EXISTS "Users can delete own meal plan items" ON meal_plan_items;
CREATE POLICY "Users can delete accessible meal plan items"
  ON meal_plan_items
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND user_has_access(meal_plans.user_id)
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_invites_invited_by ON user_invites(invited_by);
CREATE INDEX IF NOT EXISTS idx_user_invites_email ON user_invites(email);
CREATE INDEX IF NOT EXISTS idx_user_invites_status ON user_invites(status);