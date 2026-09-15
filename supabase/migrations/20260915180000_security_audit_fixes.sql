-- ====================================================================
-- C-ROB Smart Key Locker
-- Migration: Security Audit Fixes (IDOR, Logs, RPCs)
-- ====================================================================

-- 1. Fix Missing Audit Logs Schema & RLS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    action text not null,
    booking_id uuid references public.bookings(id) on delete set null,
    user_id uuid references public.profiles(id) on delete set null,
    created_at timestamptz default now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow Staff to read audit logs
DROP POLICY IF EXISTS "Staff can view audit logs" ON public.audit_logs;
CREATE POLICY "Staff can view audit logs" ON public.audit_logs
FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- Allow Staff to insert audit logs
DROP POLICY IF EXISTS "Staff can insert audit logs" ON public.audit_logs;
CREATE POLICY "Staff can insert audit logs" ON public.audit_logs
FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));


-- 2. Fix Privilege Escalation / IDOR in Bookings
-- Prevent regular members from modifying their own booking status to bypass approval.
CREATE OR REPLACE FUNCTION public.prevent_status_tampering()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- If the status column is being changed, and the caller is not staff, reject it.
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only staff can change booking status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_prevent_status_tampering ON public.bookings;
CREATE TRIGGER tr_prevent_status_tampering
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.prevent_status_tampering();


-- 3. Fix admin_update_user_role RPC to log securely to audit_logs instead of missing logs table
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
  -- Get the caller's role from their profile
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  
  -- Verify caller is an admin
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can change roles.';
  END IF;

  -- Prevent changing own role
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You cannot change your own role.';
  END IF;
  
  -- Verify the new role is valid
  IF new_role NOT IN ('member', 'execom', 'admin') THEN
    RAISE EXCEPTION 'Invalid role specified.';
  END IF;

  -- Get old role for logging and verify target exists
  SELECT role INTO old_role FROM public.profiles WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found.';
  END IF;
  
  -- Update the role.
  UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
  
  -- Insert an audit log properly into audit_logs (do NOT silently swallow exceptions)
  INSERT INTO public.audit_logs (action, user_id)
  VALUES (
    'Role changed from ' || old_role || ' to ' || new_role || ' for target user ' || target_user_id,
    auth.uid()
  );
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Secure execution permissions
REVOKE EXECUTE ON FUNCTION admin_update_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_update_user_role(UUID, TEXT) TO authenticated;
