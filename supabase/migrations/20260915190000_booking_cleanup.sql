-- ====================================================================
-- C-ROB Smart Key Locker
-- Migration: Booking Cleanup & Auto-Expiration
-- ====================================================================

-- Create a function to perform the cleanup tasks safely
CREATE OR REPLACE FUNCTION public.cleanup_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auto_expired_count INTEGER := 0;
    deleted_count INTEGER := 0;
BEGIN
    -- 1. Auto-expire pending bookings
    -- Update bookings where status is 'pending' and the start_time is in the past.
    WITH expired_bookings AS (
        UPDATE public.bookings
        SET status = 'expired'
        WHERE status = 'pending' 
          AND start_time < now()
        RETURNING id, user_id
    )
    -- Log the auto-expiration in the audit_logs
    INSERT INTO public.audit_logs (booking_id, user_id, action)
    SELECT id, user_id, 'booking_auto_expired'
    FROM expired_bookings;
    
    -- 2. Automatically delete cancelled requests after 5 days
    -- Since there is no dedicated 'cancelled_at' timestamp, we use 'start_time' 
    -- as the safest fallback. A cancelled booking whose scheduled start time 
    -- was more than 5 days ago will be permanently deleted.
    DELETE FROM public.bookings
    WHERE status = 'cancelled'
      AND start_time < (now() - interval '5 days');

END;
$$;

-- Note on scheduling:
-- To run this automatically in the background, you can use pg_cron if enabled:
-- SELECT cron.schedule('booking-cleanup', '0 * * * *', 'SELECT public.cleanup_bookings()');
