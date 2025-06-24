
-- Add missing number_of_cycles column to session_io table
ALTER TABLE public.session_io 
ADD COLUMN IF NOT EXISTS number_of_cycles integer;

-- Update the column to have a default value for existing records
UPDATE public.session_io 
SET number_of_cycles = 1 
WHERE number_of_cycles IS NULL;
