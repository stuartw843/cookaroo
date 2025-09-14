/*
  # Create AI Recipe Collections

  1. New Tables
    - `ai_recipe_collections`
      - `id` (uuid, primary key)
      - `space_id` (uuid, foreign key to spaces)
      - `name` (text, collection name)
      - `system_prompt` (text, AI system prompt for collection)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `ai_recipe_collections` table
    - Add policies for authenticated users to manage collections in accessible spaces

  3. Indexes
    - Add index on space_id for efficient queries
*/

CREATE TABLE IF NOT EXISTS ai_recipe_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  system_prompt text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ai_recipe_collections_space_id ON ai_recipe_collections (space_id);

-- Enable Row Level Security
ALTER TABLE ai_recipe_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read AI recipe collections in accessible spaces"
  ON ai_recipe_collections
  FOR SELECT
  TO authenticated
  USING (user_has_space_access(space_id));

CREATE POLICY "Users can insert AI recipe collections in accessible spaces"
  ON ai_recipe_collections
  FOR INSERT
  TO authenticated
  WITH CHECK (user_has_space_access(space_id));

CREATE POLICY "Users can update AI recipe collections in accessible spaces"
  ON ai_recipe_collections
  FOR UPDATE
  TO authenticated
  USING (user_has_space_access(space_id))
  WITH CHECK (user_has_space_access(space_id));

CREATE POLICY "Users can delete AI recipe collections in accessible spaces"
  ON ai_recipe_collections
  FOR DELETE
  TO authenticated
  USING (user_has_space_access(space_id));

-- Add trigger to update updated_at column
CREATE TRIGGER update_ai_recipe_collections_updated_at
  BEFORE UPDATE ON ai_recipe_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();