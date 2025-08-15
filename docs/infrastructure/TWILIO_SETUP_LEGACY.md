# Twilio Phone Authentication Setup

This guide walks through setting up Twilio SMS authentication with Supabase for the Strength.Design application.

## Prerequisites

1. **Twilio Account**
   - Sign up at [Twilio](https://www.twilio.com)
   - Get your Account SID and Auth Token from the Twilio Console
   - Purchase a phone number capable of sending SMS

2. **Supabase Project**
   - Your Supabase project must be on a paid plan (Phone Auth requires Pro plan or higher)

## Configuration Steps

### 1. Configure Twilio in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** → **Providers**
3. Find **Phone** in the list and enable it
4. Configure the following settings:

   ```
   SMS Provider: Twilio
   Twilio Account SID: [Your Twilio Account SID]
   Twilio Auth Token: [Your Twilio Auth Token]
   Twilio Message Service SID: [Your Message Service SID or Phone Number]
   ```

5. **SMS Template**: Customize the SMS message template:
   ```
   Your Strength.Design verification code is: {{.Code}}
   ```

6. **Settings**:
   - Enable phone confirmations
   - Set OTP expiry time (default: 60 seconds)
   - Configure rate limits if needed

### 2. Twilio Configuration

1. In your Twilio Console:
   - Go to **Phone Numbers** → **Manage** → **Active Numbers**
   - Select your phone number
   - Ensure it has SMS capabilities enabled

2. For better deliverability, create a Messaging Service:
   - Go to **Messaging** → **Services**
   - Create a new Messaging Service
   - Add your phone number to the service
   - Use the Messaging Service SID in Supabase instead of a phone number

### 3. Environment Variables

No additional environment variables are needed in your application. Twilio credentials are stored securely in Supabase.

### 4. Testing

1. **Local Testing**:
   ```bash
   npm run dev
   ```
   - Navigate to the login page
   - Click "Continue with Phone"
   - Enter a valid phone number
   - You should receive an SMS with a 6-digit code

2. **Common Issues**:
   - **No SMS received**: Check Twilio logs for delivery status
   - **Invalid phone number**: Ensure you're using E.164 format (+1XXXXXXXXXX)
   - **Rate limit**: Supabase limits SMS sends to prevent abuse

### 5. Production Considerations

1. **Verify Your Twilio Account**:
   - Complete Twilio's verification process
   - Register your business use case
   - Set up A2P 10DLC registration for US messaging

2. **Cost Management**:
   - Monitor SMS usage in Twilio Console
   - Set up billing alerts
   - Consider implementing rate limiting in your app

3. **International Support**:
   - The current implementation supports US numbers (+1)
   - To support international numbers, modify the `formatPhoneNumber` function in `PhoneAuthModal.tsx`

## Implementation Details

### Frontend Components

1. **PhoneAuthModal** (`/src/components/auth/PhoneAuthModal.tsx`):
   - Handles phone number input and formatting
   - Manages OTP verification flow
   - Provides user feedback for errors and success

2. **Auth Page Integration**:
   - Phone auth button triggers the modal
   - Successful authentication redirects to the requested page

### How It Works

1. User enters phone number
2. Frontend calls `supabase.auth.signInWithOtp({ phone })`
3. Supabase sends SMS via Twilio
4. User enters 6-digit code
5. Frontend calls `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
6. User is authenticated and session is created

### Security Notes

- Phone numbers are validated and formatted to E.164 standard
- OTP codes expire after 60 seconds
- Rate limiting prevents SMS bombing
- Sessions are managed by Supabase Auth

## Troubleshooting

### SMS Not Delivering

1. Check Twilio Console logs
2. Verify phone number format
3. Ensure Twilio account has sufficient balance
4. Check if number is on a carrier blocklist

### Authentication Errors

1. Verify Twilio credentials in Supabase
2. Check Supabase Auth logs
3. Ensure phone provider is enabled
4. Verify your Supabase plan supports phone auth

### Rate Limiting

If users hit rate limits:
1. Increase rate limits in Supabase Auth settings
2. Implement client-side cooldowns
3. Consider using CAPTCHA for additional protection

## Support

- [Twilio Support](https://support.twilio.com)
- [Supabase Docs - Phone Auth](https://supabase.com/docs/guides/auth/phone-login)
- [Strength.Design Issues](https://github.com/yourusername/strength-design/issues)