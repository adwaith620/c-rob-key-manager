-- ====================================================================
-- C-ROB Smart Key Locker
-- Migration: Secure RPC for Role Updates
-- ====================================================================

CREATE OR REPLACE FUNCTION admin_update_user_role(target_user_id UUID, new_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  old_role TEXT;
BEGIN
  -- 1. Get the caller's role from their profile
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  
  -- 2. Verify caller is an admin
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can change roles.';
  END IF;

  -- 3. Prevent changing own role
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You cannot change your own role.';
  END IF;
  
  -- 4. Verify the new role is valid
  IF new_role NOT IN ('member', 'execom', 'admin') THEN
    RAISE EXCEPTION 'Invalid role specified.';
  END IF;

  -- 5. Get old role for logging and verify target exists
  SELECT role INTO old_role FROM public.profiles WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found.';
  END IF;
  
  -- 6. Update the role.
  UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
  
  -- 7. Insert an audit log
  BEGIN
    INSERT INTO public.logs (event_type, description, metadata)
    VALUES (
      'role_changed',
      'User role updated by Admin',
      jsonb_build_object(
        'target_user', target_user_id, 
        'previous_role', old_role,
        'new_role', new_role,
        'admin', auth.uid()
      )
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 8. Secure execution permissions
REVOKE EXECUTE ON FUNCTION admin_update_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_update_user_role(UUID, TEXT) TO authenticated;
