
-- Fix function search path security warnings by setting secure search paths

-- Update check_subscription_status function to have secure search_path
CREATE OR REPLACE FUNCTION public.check_subscription_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  IF NEW.status NOT IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete') THEN
    RAISE EXCEPTION 'Invalid subscription status';
  END IF;
  RETURN NEW;
END;
$function$;

-- Update handle_updated_at function to have secure search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
