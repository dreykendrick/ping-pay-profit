-- FIX 1: Server-side plan/price enforcement
-- Create trigger to automatically set plan and price based on country
-- This prevents client-side manipulation

CREATE OR REPLACE FUNCTION public.enforce_plan_from_country()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set plan/price when country is being set or changed
  IF NEW.country IS NOT NULL AND (OLD.country IS NULL OR NEW.country IS DISTINCT FROM OLD.country) THEN
    -- If user is admin, allow manual override
    IF has_role(auth.uid(), 'admin') THEN
      -- Admin can set plan/price explicitly, but if they're not set, derive from country
      IF NEW.plan IS NULL THEN
        IF NEW.country = 'United States' THEN
          NEW.plan := 'US';
          NEW.monthly_price := 29;
        ELSE
          NEW.plan := 'EA';
          NEW.monthly_price := 10;
        END IF;
      END IF;
    ELSE
      -- Non-admin: ALWAYS derive plan/price from country (ignore any client-side values)
      IF NEW.country = 'United States' THEN
        NEW.plan := 'US';
        NEW.monthly_price := 29;
      ELSE
        NEW.plan := 'EA';
        NEW.monthly_price := 10;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS enforce_plan_from_country_trigger ON public.profiles;

-- Create trigger that runs BEFORE the check_profile_update trigger
CREATE TRIGGER enforce_plan_from_country_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_plan_from_country();

-- SECONDARY FIX: Add ON DELETE CASCADE for client → reminders
-- First check if cascade already exists and drop the constraint if it does
ALTER TABLE public.reminders 
DROP CONSTRAINT IF EXISTS reminders_client_id_fkey;

ALTER TABLE public.reminders
ADD CONSTRAINT reminders_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES public.clients(id) 
ON DELETE CASCADE;