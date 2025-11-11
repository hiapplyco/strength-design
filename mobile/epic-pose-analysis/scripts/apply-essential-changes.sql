-- Apply essential database changes manually

-- 1. Grant pro subscription to Paige
DELETE FROM public.subscriptions 
WHERE user_id = 'f3485fae-0725-4fcc-bce5-aaad4da909ec';

INSERT INTO public.subscriptions (
  id,
  user_id,
  status,
  price_id,
  quantity,
  cancel_at_period_end,
  current_period_start,
  current_period_end,
  created_at,
  metadata
) VALUES (
  'manual_override_paige_' || gen_random_uuid(),
  'f3485fae-0725-4fcc-bce5-aaad4da909ec',
  'active',
  'price_1QjidsC3HTLX6YIcMQZNNZjb',
  1,
  false,
  NOW(),
  '2099-12-31'::timestamp,
  NOW(),
  '{"manual_override": true, "granted_by": "admin", "reason": "special access"}'::jsonb
);

-- 2. Create nutrition settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.nutrition_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_calories INTEGER DEFAULT 2000,
  target_protein INTEGER DEFAULT 150,
  target_carbs INTEGER DEFAULT 250,
  target_fat INTEGER DEFAULT 65,
  target_fiber INTEGER DEFAULT 25,
  target_sugar INTEGER DEFAULT 50,
  target_sodium INTEGER DEFAULT 2300,
  target_cholesterol INTEGER DEFAULT 300,
  target_saturated_fat INTEGER DEFAULT 20,
  target_water_ml INTEGER DEFAULT 2000,
  custom_targets JSONB DEFAULT '{}',
  integrations JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('workout-uploads', 'workout-uploads', false, 10485760, 
   ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/csv','text/plain']),
  ('nutrition-uploads', 'nutrition-uploads', false, 10485760,
   ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/csv','text/plain'])
ON CONFLICT (id) DO NOTHING;

-- 4. Verify Paige's subscription
SELECT 
  u.email,
  s.status,
  s.current_period_end,
  s.metadata
FROM auth.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id
WHERE u.email = 'paigerarndt46@gmail.com';