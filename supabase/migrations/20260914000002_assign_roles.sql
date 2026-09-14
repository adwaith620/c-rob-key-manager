-- ====================================================================
-- C-ROB Smart Key Locker
-- Migration: Assign Admin and ExeCom Roles
-- 
-- IMPORTANT: Run this script in the Supabase SQL Editor to correctly
-- assign the Admin and ExeCom roles. The frontend no longer uses 
-- hardcoded email overrides for security reasons.
-- ====================================================================

-- 1. Set the Admin account
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = '250168@tkmce.ac.in'
);

-- 2. Set the ExeCom account
-- Replace 'execom_email@tkmce.ac.in' with the actual ExeCom email.
UPDATE public.profiles
SET role = 'execom'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'execom_email@tkmce.ac.in'
);
