CREATE OR REPLACE FUNCTION public.check_profile_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If user is admin, allow all updates
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  
  -- For regular users, prevent changing sensitive fields
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Cannot modify is_active field';
  END IF;
  
  -- Allow plan/price changes ONLY when country is being set for the first time (onboarding)
  -- The enforce_plan_from_country trigger will set these based on the country
  IF OLD.country IS NULL AND NEW.country IS NOT NULL THEN
    -- This is onboarding - allow the system trigger to set plan/price
    RETURN NEW;
  END IF;
  
  -- After onboarding, prevent changing plan/price
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'Cannot modify plan field';
  END IF;
  
  IF NEW.monthly_price IS DISTINCT FROM OLD.monthly_price THEN
    RAISE EXCEPTION 'Cannot modify monthly_price field';
  END IF;
  
  -- Prevent changing country after initial setup
  IF OLD.country IS NOT NULL AND NEW.country IS DISTINCT FROM OLD.country THEN
    RAISE EXCEPTION 'Cannot modify country after initial setup';
  END IF;
  
  RETURN NEW;
END;
$function$;