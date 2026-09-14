-- ====================================================================
-- C-ROB Smart Key Locker
-- Migration: Add Booking Type, Team Size, and Purpose
-- ====================================================================

-- Add the new columns
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS purpose TEXT;

-- Update existing records to safe defaults if they are somehow missing the defaults
UPDATE public.bookings SET booking_type = 'individual' WHERE booking_type IS NULL;
UPDATE public.bookings SET team_size = 1 WHERE team_size IS NULL;

-- Make the type and size columns NOT NULL
ALTER TABLE public.bookings ALTER COLUMN booking_type SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN team_size SET NOT NULL;

-- Add check constraints
ALTER TABLE public.bookings ADD CONSTRAINT check_booking_type CHECK (booking_type IN ('individual', 'team'));
ALTER TABLE public.bookings ADD CONSTRAINT check_team_size CHECK (team_size >= 1 AND team_size <= 30);
ALTER TABLE public.bookings ADD CONSTRAINT check_booking_logic CHECK (
  (booking_type = 'individual' AND team_size = 1) OR 
  (booking_type = 'team' AND team_size >= 2 AND team_size <= 30)
);

