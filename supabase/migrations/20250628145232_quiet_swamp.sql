/*
  # Add Weekly Meal Planner

  1. New Tables
    - `meal_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `week_start_date` (date)
      - `name` (text, optional custom name for the week)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `meal_plan_items`
      - `id` (uuid, primary key)
      - `meal_plan_id` (uuid, foreign key to meal_plans)
      - `day_of_week` (integer, 0-6 where 0 is Sunday)
      - `meal_type` (text: breakfast, lunch, dinner, snack)
      - `recipe_id` (uuid, foreign key to recipes, nullable)
      - `custom_text` (text, for manual entries, nullable)
      - `notes` (text, optional notes)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own meal plans
*/

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meal_plan_items table
CREATE TABLE IF NOT EXISTS meal_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  custom_text text,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT meal_plan_items_content_check CHECK (
    (recipe_id IS NOT NULL AND custom_text IS NULL) OR 
    (recipe_id IS NULL AND custom_text IS NOT NULL)
  )
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week_start ON meal_plans(week_start_date);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_meal_plan_id ON meal_plan_items(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_recipe_id ON meal_plan_items(recipe_id);

-- Enable RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;

-- Create policies for meal_plans
CREATE POLICY "Users can read own meal plans"
  ON meal_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON meal_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for meal_plan_items
CREATE POLICY "Users can read own meal plan items"
  ON meal_plan_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans 
    WHERE meal_plans.id = meal_plan_items.meal_plan_id 
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own meal plan items"
  ON meal_plan_items
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_plans 
    WHERE meal_plans.id = meal_plan_items.meal_plan_id 
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own meal plan items"
  ON meal_plan_items
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans 
    WHERE meal_plans.id = meal_plan_items.meal_plan_id 
    AND meal_plans.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_plans 
    WHERE meal_plans.id = meal_plan_items.meal_plan_id 
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own meal plan items"
  ON meal_plan_items
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans 
    WHERE meal_plans.id = meal_plan_items.meal_plan_id 
    AND meal_plans.user_id = auth.uid()
  ));

-- Add trigger for updated_at
CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();