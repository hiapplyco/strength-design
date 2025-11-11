-- Grant Pro subscription to paigerarndt46@gmail.com
INSERT INTO public.subscriptions (
  id,
  user_id,
  status,
  price_id,
  quantity,
  cancel_at_period_end,
  current_period_start,
  current_period_end,
  created,
  updated
) VALUES (
  'manual_' || gen_random_uuid(),
  'f3485fae-0725-4fcc-bce5-aaad4da909ec',
  'active',
  'price_1QjidsC3HTLX6YIcMQZNNZjb',
  1,
  false,
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW()
);