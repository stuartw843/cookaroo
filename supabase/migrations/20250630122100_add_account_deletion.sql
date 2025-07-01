/*
  # Add Account Deletion Functionality

  1. Changes
    - Create a function to delete all user data and account
    - This will cascade delete all related data in the correct order

  2. Security
    - Function is SECURITY DEFINER to allow deletion of auth.users
    - Only allows users to delete their own account
    - Comprehensive logging for audit trail
*/

-- Create function to delete user account and all associated data
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  spaces_count integer;
  recipes_count integer;
  meal_plans_count integer;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Ensure user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to delete account';
  END IF;

  -- Log the deletion attempt
  RAISE LOG 'Starting account deletion for user ID: %', current_user_id;

  -- Count data for logging
  SELECT COUNT(*) INTO spaces_count FROM spaces WHERE owner_id = current_user_id;
  SELECT COUNT(*) INTO recipes_count FROM recipes WHERE user_id = current_user_id;
  SELECT COUNT(*) INTO meal_plans_count FROM meal_plans WHERE user_id = current_user_id;
  
  RAISE LOG 'User % has % spaces, % recipes, % meal plans', current_user_id, spaces_count, recipes_count, meal_plans_count;

  -- Delete user data in correct order (foreign key constraints will handle cascading)
  
  -- 1. Delete meal plan items (will cascade from meal_plans deletion, but explicit for clarity)
  DELETE FROM meal_plan_items 
  WHERE meal_plan_id IN (
    SELECT id FROM meal_plans WHERE user_id = current_user_id
  );
  
  -- 2. Delete meal plans
  DELETE FROM meal_plans WHERE user_id = current_user_id;
  
  -- 3. Delete ingredients and instructions (will cascade from recipes deletion)
  DELETE FROM ingredients 
  WHERE recipe_id IN (
    SELECT id FROM recipes WHERE user_id = current_user_id
  );
  
  DELETE FROM instructions 
  WHERE recipe_id IN (
    SELECT id FROM recipes WHERE user_id = current_user_id
  );
  
  -- 4. Delete recipes
  DELETE FROM recipes WHERE user_id = current_user_id;
  
  -- 5. Delete user preferences
  DELETE FROM user_preferences WHERE user_id = current_user_id;
  
  -- 6. Delete space memberships (where user is a member, not owner)
  DELETE FROM space_members WHERE user_id = current_user_id;
  
  -- 7. Delete space invites created by user
  DELETE FROM space_invites WHERE created_by = current_user_id;
  
  -- 8. Delete spaces owned by user (this will cascade to space_members and space_invites)
  DELETE FROM spaces WHERE owner_id = current_user_id;
  
  -- 9. Delete user profile
  DELETE FROM users WHERE id = current_user_id;
  
  -- 10. Finally, delete the auth user (this must be last)
  DELETE FROM auth.users WHERE id = current_user_id;
  
  RAISE LOG 'Successfully deleted account for user ID: %', current_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error deleting account for user ID %: % (SQLSTATE: %)', current_user_id, SQLERRM, SQLSTATE;
    RAISE EXCEPTION 'Failed to delete account: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION delete_user_account() IS 'Deletes the current authenticated user account and all associated data. This action is irreversible.';
