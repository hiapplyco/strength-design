
-- Add workout usage tracking to profiles table
ALTER TABLE public.profiles ADD COLUMN free_workouts_used INTEGER NOT NULL DEFAULT 0;

-- Add index for better performance when querying workout usage
CREATE INDEX idx_profiles_free_workouts_used ON public.profiles(free_workouts_used);

-- Update the handle_new_user function to ensure new users start with 0 free workouts used
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  -- Insert the user ID into the profiles table with default values
  insert into public.profiles (id, free_workouts_used)
  values (new.id, 0);
  return new;
end;
$function$;
