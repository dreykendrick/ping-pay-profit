-- ADD-ON 1: Add country and monthly_price to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS monthly_price numeric;

-- ADD-ON 2: Add tracking fields to reminders for scheduled email sending
ALTER TABLE public.reminders
ADD COLUMN IF NOT EXISTS user_notified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS client_emailed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS attempt_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_attempt_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS send_client_email boolean DEFAULT false;

-- Add email column to clients table for direct client emailing
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS email text;

-- SECURITY: Update profiles RLS to prevent users from updating sensitive fields
-- Drop the existing user update policy
DROP POLICY IF EXISTS "Users can update their own profile (limited fields)" ON public.profiles;

-- Recreate with more restrictive policy - users can only update non-sensitive fields
-- Note: Currently profiles only has email which users shouldn't change directly
-- The new country field should only be set once during onboarding
CREATE POLICY "Users can update their own profile (limited fields)" 
ON public.profiles 
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND
  -- Prevent changing sensitive fields by comparing to existing values
  -- This check ensures is_active, plan, monthly_price remain unchanged by regular users
  -- Since we can't reference OLD in WITH CHECK, admins will update via their policy
  true
);

-- Create a function to validate profile updates by regular users
CREATE OR REPLACE FUNCTION public.check_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user is admin, allow all updates
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  
  -- For regular users, prevent changing sensitive fields
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Cannot modify is_active field';
  END IF;
  
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'Cannot modify plan field';
  END IF;
  
  IF NEW.monthly_price IS DISTINCT FROM OLD.monthly_price THEN
    RAISE EXCEPTION 'Cannot modify monthly_price field';
  END IF;
  
  -- Allow country to be set only once (during onboarding)
  IF OLD.country IS NOT NULL AND NEW.country IS DISTINCT FROM OLD.country THEN
    RAISE EXCEPTION 'Cannot modify country after initial setup';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile update validation
DROP TRIGGER IF EXISTS validate_profile_update ON public.profiles;
CREATE TRIGGER validate_profile_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_profile_update();