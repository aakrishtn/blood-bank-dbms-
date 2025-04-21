-- Create a function to confirm a user's email manually
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This function will run with the privileges of the creator
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = user_email;
  
  -- If user not found, return false
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update the user's email_confirmed_at value
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = v_user_id AND email_confirmed_at IS NULL;
  
  RETURN TRUE;
END;
$$;

-- Grant usage of the function to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.confirm_user_email(TEXT) TO authenticated, anon; 