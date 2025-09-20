/*
  # Add notes field to recipes

  1. New Columns
    - `notes` (text, nullable) - Personal notes about the recipe

  2. Changes
    - Add notes column to recipes table
    - Allow users to store personal cooking notes, modifications, or reminders

  3. Benefits
    - Users can add personal cooking tips
    - Track recipe modifications and improvements
    - Store family preferences or dietary notes
*/

-- Add notes column to recipes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recipes' AND column_name = 'notes'
  ) THEN
    ALTER TABLE recipes ADD COLUMN notes text;
  END IF;
END $$;