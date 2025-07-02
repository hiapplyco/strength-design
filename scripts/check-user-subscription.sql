-- Check subscription status for paigerarndt46@gmail.com
-- First, get the user ID
WITH user_info AS (
  SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
  FROM auth.users 
  WHERE email = 'paigerarndt46@gmail.com'
)
-- Then check their subscription status
SELECT 
  u.email,
  u.id as user_id,
  u.created_at as user_created,
  u.last_sign_in_at,
  s.id as subscription_id,
  s.status as subscription_status,
  s.price_id,
  s.current_period_start,
  s.current_period_end,
  s.created_at as subscription_created,
  CASE 
    WHEN s.status = 'active' THEN 'Yes - Active Subscription'
    WHEN s.status = 'trialing' THEN 'Yes - Trial Period'
    WHEN s.status IS NULL THEN 'No - No Subscription Found'
    ELSE 'No - Status: ' || s.status
  END as has_pro_access
FROM user_info u
LEFT JOIN public.subscriptions s ON u.id = s.user_id
ORDER BY s.created_at DESC;