-- Grant Pro subscription to paigerarndt46@gmail.com with manual override
-- This creates a special subscription entry that the app should recognize

-- First, remove any existing subscriptions for this user
DELETE FROM public.subscriptions 
WHERE user_id = 'f3485fae-0725-4fcc-bce5-aaad4da909ec';

-- Insert a new active subscription with a special ID that indicates manual override
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
  'price_1QjidsC3HTLX6YIcMQZNNZjb', -- Unlimited plan
  1,
  false,
  NOW(),
  '2099-12-31'::timestamp, -- Far future date
  NOW(),
  '{"manual_override": true, "granted_by": "admin", "reason": "special access"}'::jsonb
);

-- Verify the subscription was created
SELECT 
  id,
  user_id,
  status,
  current_period_end,
  metadata
FROM public.subscriptions 
WHERE user_id = 'f3485fae-0725-4fcc-bce5-aaad4da909ec';