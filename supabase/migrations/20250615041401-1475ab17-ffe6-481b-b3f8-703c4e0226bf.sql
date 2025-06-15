
-- Rename the table to better reflect its new purpose
ALTER TABLE public.technique_analyses RENAME TO movement_analyses;

-- Add a column to store analysis metadata (like analysis type, model used, etc.)
ALTER TABLE public.movement_analyses ADD COLUMN metadata jsonb;
