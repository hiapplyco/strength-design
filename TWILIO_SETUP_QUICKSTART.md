# Twilio Phone Authentication Quick Setup

## What's Already Implemented

✅ **Frontend Components**
- PhoneAuthModal with US phone number formatting
- OTP verification flow
- Rate limiting (3 attempts per 15 minutes)
- Resend functionality with 60-second countdown
- Error handling and user feedback

✅ **Security Features**
- Client-side rate limiting
- Phone number validation
- Session management via Supabase
- Automatic form reset on modal close

## What You Need to Configure

### 1. Twilio Account Setup (5 minutes)
1. Sign up at [twilio.com](https://www.twilio.com)
2. Get your credentials from the Twilio Console:
   - Account SID
   - Auth Token
   - Buy a phone number with SMS capability

### 2. Supabase Configuration (5 minutes)
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** → **Providers** → **Phone**
3. Enable Phone Provider and enter:
   ```
   SMS Provider: Twilio
   Twilio Account SID: [Your Account SID]
   Twilio Auth Token: [Your Auth Token]
   Twilio Phone Number: [Your Twilio Phone Number]
   ```
4. Save the configuration

### 3. Test It
1. Run your app: `npm run dev`
2. Click "Continue with Phone" on the login page
3. Enter a US phone number
4. You should receive an SMS with a 6-digit code
5. Enter the code to complete authentication

## Important Notes

- **Supabase Plan**: Phone auth requires a Pro plan or higher
- **Phone Format**: Currently supports US numbers only (+1)
- **Rate Limits**: Users can send 3 SMS per phone number every 15 minutes
- **Twilio Credits**: New accounts get free credits for testing

## Troubleshooting

If SMS doesn't send:
1. Check Twilio Console for error logs
2. Verify your Twilio account has credits
3. Ensure phone number has SMS capability
4. Check Supabase logs for authentication errors

## Full Documentation

For detailed setup instructions and international support, see:
`docs/twilio_setup.md`