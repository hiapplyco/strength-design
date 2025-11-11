
ALTER TABLE public.generated_workouts
ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT FALSE;
