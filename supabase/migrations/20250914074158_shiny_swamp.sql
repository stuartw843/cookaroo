/*
  # Add AI fields to recipes table

  1. New Columns
    - `ai_collection_id` (uuid, nullable, foreign key to ai_recipe_collections)
    - `generation_prompt` (text, nullable, stores the user prompt used for AI generation)
    - `is_ai_generated` (boolean, default false, tracks if recipe was AI generated)

  2. Indexes
    - Add index on ai_collection_id for efficient queries

  3. Foreign Keys
    - Link ai_collection_id to ai_recipe_collections table with cascade delete
*/

-- Add AI-related columns to recipes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'ai_collection_id'
  ) THEN
    ALTER TABLE recipes ADD COLUMN ai_collection_id uuid REFERENCES ai_recipe_collections(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'generation_prompt'
  ) THEN
    ALTER TABLE recipes ADD COLUMN generation_prompt text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'is_ai_generated'
  ) THEN
    ALTER TABLE recipes ADD COLUMN is_ai_generated boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add index for ai_collection_id
CREATE INDEX IF NOT EXISTS idx_recipes_ai_collection_id ON recipes (ai_collection_id);