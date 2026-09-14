-- Run this in the Supabase SQL Editor to make the user an admin in the database
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = '250168@tkmce.ac.in';
