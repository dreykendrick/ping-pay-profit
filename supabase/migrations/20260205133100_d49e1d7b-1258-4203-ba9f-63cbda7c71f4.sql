CREATE OR REPLACE FUNCTION public.enforce_plan_from_country()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  african_countries TEXT[] := ARRAY[
    'Tanzania', 'Kenya', 'Uganda', 'Rwanda', 'Nigeria', 'Ghana', 'South Africa',
    'Ethiopia', 'Egypt', 'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Sudan',
    'Senegal', 'Ivory Coast', 'Cameroon', 'Zimbabwe', 'Zambia', 'Botswana',
    'Namibia', 'Mozambique', 'Angola', 'Democratic Republic of the Congo',
    'Madagascar', 'Malawi', 'Mali', 'Burkina Faso', 'Niger', 'Chad'
  ];
BEGIN
  -- Only set plan/price when country is being set or changed
  IF NEW.country IS NOT NULL AND (OLD.country IS NULL OR NEW.country IS DISTINCT FROM OLD.country) THEN
    -- If user is admin, allow manual override
    IF has_role(auth.uid(), 'admin') THEN
      -- Admin can set plan/price explicitly, but if they're not set, derive from country
      IF NEW.plan IS NULL THEN
        IF NEW.country = ANY(african_countries) THEN
          NEW.plan := 'EA';
          NEW.monthly_price := 10;
        ELSE
          NEW.plan := 'US';
          NEW.monthly_price := 29;
        END IF;
      END IF;
    ELSE
      -- Non-admin: ALWAYS derive plan/price from country (ignore any client-side values)
      IF NEW.country = ANY(african_countries) THEN
        NEW.plan := 'EA';
        NEW.monthly_price := 10;
      ELSE
        NEW.plan := 'US';
        NEW.monthly_price := 29;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;