-- One-time migration to grant Pro subscription to paigerarndt46@gmail.com
DO $$
BEGIN
  -- Only insert if user doesn't already have an active subscription
  IF NOT EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = 'f3485fae-0725-4fcc-bce5-aaad4da909ec'
    AND status IN ('active', 'trialing')
  ) THEN
    INSERT INTO public.subscriptions (
      id,
      user_id,
      status,
      price_id,
      quantity,
      cancel_at_period_end,
      current_period_start,
      current_period_end,
      created_at
    ) VALUES (
      'manual_' || gen_random_uuid(),
      'f3485fae-0725-4fcc-bce5-aaad4da909ec',
      'active',
      'price_1QjidsC3HTLX6YIcMQZNNZjb',
      1,
      false,
      NOW(),
      NOW() + INTERVAL '1 year',
      NOW()
    );
  END IF;
END $$;