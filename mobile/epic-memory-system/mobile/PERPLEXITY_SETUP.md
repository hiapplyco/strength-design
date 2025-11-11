# Perplexity API Setup for Search Programs

## Overview
The Search Programs feature uses the real Perplexity API to search for evidence-based workout programs from credible sources. **NO FALLBACKS** - The API key is required for this feature to work.

## Setup Instructions

### 1. Get Perplexity API Key
1. Sign up at https://www.perplexity.ai/settings/api
2. Generate an API key
3. Copy the key for the next steps

### 2. Configure Firebase Functions

#### Option A: Using Firebase CLI (Recommended for Production)
```bash
# Login to Firebase
firebase login --reauth

# Set the active project
firebase use strength-design

# Set the Perplexity API key
firebase functions:config:set perplexity.api_key="YOUR_PERPLEXITY_API_KEY_HERE"

# Deploy the functions (Note: Due to Gen 1/Gen 2 mixing, deploy from main project)
cd /Users/jms/Development/strength-design
firebase deploy --only functions:searchPrograms
```

#### Option B: Using Environment Variable (For Local Development)
```bash
# In the functions directory, create a .env file
cd mobile/functions
echo 'PERPLEXITY_API_KEY=YOUR_PERPLEXITY_API_KEY_HERE' > .env

# Run functions locally
npm run serve
```

### 3. Test the Integration

After deployment, the Search Programs feature will:
1. **REQUIRE** a configured Perplexity API key to function
2. Return proper error messages if the API key is missing or invalid
3. Throw specific errors for rate limits, authentication issues, or service unavailability

## Features Implemented

### searchPrograms Firebase Function
- **Location**: `mobile/functions/index.js`
- **Endpoint**: `searchPrograms` (callable function)
- **Parameters**:
  - `query`: Search query string (required)
  - `searchType`: Type of search (optional)
  - `focus`: Array of focus areas (optional)
  - `difficulty`: Experience level (optional)
  - `duration`: Program duration (optional)
  - `equipment`: Array of equipment types (optional)

### Response Format
```javascript
{
  programs: [
    {
      name: "Program Name",
      description: "Program description",
      difficulty: "beginner|intermediate|advanced",
      duration: "Duration string",
      focus: ["strength", "muscle building"],
      equipment: ["barbell", "dumbbells"],
      overview: "Detailed overview",
      structure: "Weekly structure",
      benefits: ["Benefit 1", "Benefit 2"],
      creator: "Creator name",
      source: "Source reference",
      popularity: 1-5
    }
  ],
  summary: "Search summary",
  relatedQueries: ["query1", "query2"],
  searchTime: "ISO timestamp",
  source: "perplexity|cache"
}
```

## API Features

### Intelligent Search
- Searches for evidence-based programs from credible sources
- Filters by certified trainers, academic research, and established organizations
- Parses unstructured text into structured program data

### Error Handling (NO FALLBACKS)
- **Missing API Key**: Returns "Perplexity API key is not configured" error
- **Invalid API Key**: Returns "Invalid Perplexity API key" error
- **Rate Limiting**: Returns "Search rate limit exceeded" error
- **Service Unavailable**: Returns appropriate service unavailable error
- **No mock data or fallbacks** - Real API responses only

## API Key Required

The Perplexity API key is **REQUIRED** for the Search Programs feature to work. Without it:
- The feature will not function
- Users will see an error message
- No mock data will be provided

## Production Deployment

1. **Set API Key in Firebase Console**:
   - Go to Firebase Console > Functions > Configuration
   - Add `perplexity.api_key` with your API key

2. **Deploy Functions**:
   ```bash
   firebase deploy --only functions:searchPrograms
   ```

3. **Monitor Usage**:
   - Check Firebase Functions logs for API usage
   - Monitor Perplexity API dashboard for rate limits

## Security Notes

- API key is stored server-side only (never exposed to client)
- All API calls go through Firebase Functions
- Rate limiting and caching implemented to minimize API usage
- Fallback ensures service continuity

## Support

If you encounter issues:
1. Check Firebase Functions logs: `firebase functions:log`
2. Verify API key is correctly set: `firebase functions:config:get`
3. Test with mock data first to ensure client integration works
4. Contact support with error messages from logs