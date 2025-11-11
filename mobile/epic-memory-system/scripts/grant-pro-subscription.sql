-- Grant Pro Subscription to User
-- Usage: Replace USER_ID_HERE with the actual user ID from auth.users table
-- Run via Supabase CLI: supabase db execute -f scripts/grant-pro-subscription.sql

-- First, check if user exists and doesn't already have an active subscription
DO $$
DECLARE
  target_user_id UUID := 'USER_ID_HERE'::UUID;
  user_exists BOOLEAN;
  has_active_subscription BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = target_user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User with ID % does not exist', target_user_id;
  END IF;
  
  -- Check if user already has an active subscription
  SELECT EXISTS(
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = target_user_id 
    AND status IN ('active', 'trialing')
  ) INTO has_active_subscription;
  
  IF has_active_subscription THEN
    RAISE NOTICE 'User % already has an active subscription', target_user_id;
    RETURN;
  END IF;
  
  -- Grant subscription
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
    'manual_' || gen_random_uuid()::TEXT,
    target_user_id,
    'active',
    'price_1QjidsC3HTLX6YIcMQZNNZjb', -- Unlimited plan
    1,
    false,
    NOW(),
    NOW() + INTERVAL '1 year',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Successfully granted Pro subscription to user %', target_user_id;
END $$;

-- Optional: Query to find a user by email
-- SELECT id, email FROM auth.users WHERE email = 'user@example.com';

-- Optional: Verify the subscription was created
-- SELECT * FROM public.subscriptions WHERE user_id = 'USER_ID_HERE';