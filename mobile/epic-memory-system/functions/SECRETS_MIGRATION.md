# Firebase Secrets Migration Guide

## Migration Complete ✅

Your Firebase functions have been successfully migrated from the legacy `functions.config()` to the modern Firebase Secrets Manager.

## Updated Functions

### AI Functions
- `chatWithGemini` - Uses `GEMINI_API_KEY`
- `enhancedChat` - Uses `GEMINI_API_KEY`
- `generateWorkout` - Uses `GEMINI_API_KEY`

### Stripe Functions
- `createCheckout` - Uses `STRIPE_SECRET_KEY`
- `customerPortal` - Uses `STRIPE_SECRET_KEY`
- `stripeWebhook` - Uses `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`

## Local Development

For local development with the Firebase emulator, you need to set up local secrets:

```bash
cd functions
./setup-local-secrets.sh
```

Then edit `.runtimeconfig.json` and replace the placeholders with your actual secret values.

## Deployment

To deploy your updated functions:

```bash
firebase deploy --only functions
```

The secrets will be automatically pulled from Firebase Secrets Manager during deployment.

## Managing Secrets

```bash
# List all secrets
firebase functions:secrets:list

# View a secret (requires permissions)
firebase functions:secrets:access SECRET_NAME

# Update a secret
firebase functions:secrets:set SECRET_NAME

# Delete a secret
firebase functions:secrets:destroy SECRET_NAME

# Clean up old versions
firebase functions:secrets:prune
```

## Benefits of Migration

1. **Enhanced Security**: Secrets are stored in Google Secret Manager
2. **Version Control**: Automatic versioning of secret values
3. **Access Control**: Fine-grained IAM permissions
4. **Audit Logging**: Track who accessed secrets and when
5. **Modern API**: Better integration with Firebase Functions v2

## Notes

- The old `functions.config()` values are still in place but are no longer used
- You can remove them with: `firebase functions:config:unset gemini stripe`
- Secret Manager has a small cost (~$0.06/month per secret)
- Secrets are only accessible in deployed functions, not in client code