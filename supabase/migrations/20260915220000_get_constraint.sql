CREATE OR REPLACE FUNCTION public.get_constraint_def() RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint WHERE conname = 'check_additional_people';
  RETURN def;
END; $$;
