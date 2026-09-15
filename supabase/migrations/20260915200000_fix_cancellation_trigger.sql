-- 2. Fix Privilege Escalation / IDOR in Bookings
-- Prevent regular members from modifying their own booking status to bypass approval.
-- Allow members to cancel their own bookings.
CREATE OR REPLACE FUNCTION public.prevent_status_tampering()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- If the status column is being changed, and the caller is not staff
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.is_staff(auth.uid()) THEN
    -- Allow members to cancel their own bookings
    IF NEW.status = 'cancelled' AND OLD.user_id = auth.uid() THEN
      -- Proceed with cancellation
    ELSE
      RAISE EXCEPTION 'Unauthorized: Only staff can change booking status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
