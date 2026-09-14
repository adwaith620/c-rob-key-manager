-- Add new columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_type text DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS purpose_of_visit text,
ADD COLUMN IF NOT EXISTS additional_people integer DEFAULT 0;

-- Check constraint for booking_type
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS check_booking_type;
ALTER TABLE public.bookings ADD CONSTRAINT check_booking_type CHECK (booking_type IN ('individual', 'team'));

-- Remove purpose_of_visit constraint if it exists (now optional)
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS check_purpose_not_empty;

-- Check constraint for additional_people
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS check_additional_people;
ALTER TABLE public.bookings ADD CONSTRAINT check_additional_people CHECK (
  (booking_type = 'individual' AND additional_people = 0) OR
  (booking_type = 'team' AND additional_people >= 1)
);

-- Remove old trigger if it existed from previous version
DROP TRIGGER IF EXISTS tr_validate_team_members ON public.bookings;
DROP FUNCTION IF EXISTS public.validate_team_members();

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    action text NOT NULL,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    booking_type text,
    purpose_of_visit text,
    additional_people integer DEFAULT 0
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins and execom can select audit logs
DROP POLICY IF EXISTS "Admins and execom can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins and execom can view audit logs" ON public.audit_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'execom')
    )
);

-- Users can insert their own logs
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.audit_logs;
CREATE POLICY "Users can insert their own logs" ON public.audit_logs
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);
