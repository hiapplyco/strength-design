# Knowledge Pipeline Setup Guide

This guide walks you through setting up the Strength.Design Knowledge Pipeline from scratch.

## 📋 Prerequisites

### System Requirements
- Node.js 18+ 
- npm or yarn
- Firebase CLI
- Git

### Required Accounts & APIs
- Firebase project with Firestore and Functions enabled
- Google AI (Gemini) API key
- Optional: Reddit API credentials for enhanced access

## 🏗️ Initial Setup

### 1. Install Dependencies

```bash
cd knowledge-pipeline
npm install
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Firebase private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Google AI / Gemini API
GEMINI_API_KEY=your-gemini-api-key-here

# Optional: Reddit API (for enhanced access)
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
REDDIT_USER_AGENT=FitnessKnowledgeIngestor/1.0 (by /u/yourusername)
```

### 3. Firebase Setup

#### Service Account Setup
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as `firebase-service-account.json` in the project root
4. Or use environment variables (recommended for production)

#### Firestore Security Rules
Update your Firestore rules to allow knowledge access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Knowledge collection - read access for authenticated users
    match /knowledge/{document} {
      allow read: if request.auth != null;
      allow write: if false; // Only server-side writes
    }
    
    // System stats - admin read only
    match /system/{document} {
      allow read: if request.auth != null && request.auth.token.admin == true;
      allow write: if false;
    }
  }
}
```

#### Firebase Functions Setup
The knowledge functions are already integrated into your existing Firebase Functions setup. Make sure to deploy them:

```bash
cd functions
npm run deploy
```

### 4. Configure Data Sources

Edit `config/fitness-sources.json` to customize:

```json
{
  "reddit": {
    "subreddits": [
      "fitness",
      "bodyweightfitness", 
      "weightroom",
      "powerlifting"
    ],
    "min_score": 10,
    "min_comments": 5
  },
  "wikipedia": {
    "search_terms": [
      "strength training",
      "cardio exercise",
      "nutrition fitness"
    ]
  }
}
```

## 🧪 Test Your Setup

### 1. Test Environment Variables
```bash
npm run test:credentials
```

### 2. Test Small Ingestion
```bash
npm run ingest:test
```

This will:
- Fetch 10 items from Reddit
- Process and validate the content
- Save to `data/test-knowledge.jsonl`

### 3. Test Firebase Upload
```bash
npx ts-node src/utils/firebase-uploader.ts -f data/test-knowledge.jsonl --dry-run
```

### 4. Test Search Function
```bash
# From your mobile app or test script
import { knowledgeService } from '../services/KnowledgeService';

const results = await knowledgeService.searchKnowledge({
  query: 'deadlift',
  limit: 5
});
console.log(results);
```

## 🚀 Production Deployment

### 1. Set Production Environment Variables

In Firebase Functions, set the production secrets:

```bash
firebase functions:config:set gemini.api_key="your-production-gemini-key"
firebase functions:config:set reddit.client_id="your-reddit-id"
firebase functions:config:set reddit.client_secret="your-reddit-secret"
```

For Functions v2 (using Google Secret Manager):
```bash
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set REDDIT_CLIENT_ID
firebase functions:secrets:set REDDIT_CLIENT_SECRET
```

### 2. Deploy Firebase Functions

```bash
cd functions
firebase deploy --only functions:searchKnowledge,functions:ingestKnowledge,functions:processKnowledgeContent,functions:getKnowledgeStats,functions:updateKnowledgeIndex
```

### 3. Set Up Automated Ingestion

Create a scheduled function for regular content updates:

```typescript
// functions/src/scheduled/dailyIngestion.ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';

export const dailyKnowledgeIngestion = onSchedule(
  {
    schedule: 'every day 02:00',
    timeZone: 'UTC'
  },
  async (event) => {
    logger.info('Starting scheduled knowledge ingestion');
    
    // Trigger ingestion process
    // Implementation depends on your infrastructure setup
  }
);
```

## 📊 Monitoring & Maintenance

### 1. Set Up Logging

Monitor logs in Firebase Console:
- Functions → Logs
- Filter by function name (searchKnowledge, ingestKnowledge, etc.)

### 2. Configure Alerts

Set up alerts for:
- Function errors and timeouts
- High memory usage
- Ingestion failures
- Search performance issues

### 3. Regular Maintenance Tasks

Create a maintenance schedule:

**Daily (Automated)**
- Ingest new content (50-100 items)
- Update search indexes
- Clean temporary files

**Weekly (Manual)**
- Review ingestion quality
- Update source configurations
- Check performance metrics

**Monthly (Manual)**  
- Rebuild full search index
- Archive old content
- Update quality thresholds

## 🔧 Advanced Configuration

### Custom Quality Scoring

Modify quality calculation in `src/fitness-ingestor.ts`:

```typescript
private calculateQualityScore(content: ProcessedContent): number {
  let score = 0.5; // Base score

  // Your custom scoring logic
  if (content.source === 'wikipedia') {
    score += 0.3; // Higher trust for Wikipedia
  }
  
  // Fitness keyword density
  const keywordDensity = this.calculateKeywordDensity(content.content);
  score += keywordDensity * 0.2;
  
  return Math.min(score, 1.0);
}
```

### Custom Content Filters

Add domain-specific filters:

```typescript
private isHighQualityContent(content: ProcessedContent): boolean {
  // Must contain exercise-related terms
  const exerciseTerms = ['exercise', 'workout', 'training', 'form'];
  const hasExerciseTerms = exerciseTerms.some(term => 
    content.content.toLowerCase().includes(term)
  );
  
  // Exclude promotional content
  const promotionalTerms = ['buy now', 'discount', 'affiliate'];
  const isPromotional = promotionalTerms.some(term =>
    content.content.toLowerCase().includes(term)
  );
  
  return hasExerciseTerms && !isPromotional;
}
```

### Performance Optimization

For high-volume deployments:

```json
{
  "processing": {
    "batch_size": 50,
    "concurrent_requests": 10,
    "cache_timeout_minutes": 60
  },
  "firebase": {
    "max_batch_size": 500,
    "timeout_seconds": 540
  }
}
```

## 🚨 Troubleshooting

### Common Setup Issues

**Firebase Authentication Errors**
```bash
# Check service account permissions
firebase projects:list

# Verify Firestore rules
firebase firestore:rules:get

# Test connection
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
console.log('Firebase connection successful');
"
```

**API Rate Limiting**
```bash
# Check current rate limits
curl -I https://www.reddit.com/r/fitness.json

# Monitor rate limit headers
# X-Ratelimit-Remaining: 59
# X-Ratelimit-Reset: 1640995200
```

**Memory Issues**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run ingest:all
```

**Search Not Working**
```bash
# Check if knowledge collection exists
firebase firestore:get knowledge --limit 1

# Verify search function deployment
firebase functions:list | grep searchKnowledge

# Test search function directly
firebase functions:shell
> searchKnowledge({query: 'test'})
```

### Debug Mode

Enable detailed logging:

```bash
export LOG_LEVEL=debug
export DEBUG_MODE=true
npm run ingest:test
```

This will output:
- Detailed API requests and responses
- Content processing steps
- Quality score calculations
- Firebase upload progress

## 📱 Mobile App Integration

### Update KnowledgeService Import

Make sure your mobile app imports the service correctly:

```javascript
// mobile/services/index.js
export { knowledgeService } from './KnowledgeService';

// In your component
import { knowledgeService } from '../services';
```

### Error Handling

Implement proper error handling in your mobile app:

```javascript
const searchKnowledge = async (query) => {
  try {
    const results = await knowledgeService.searchKnowledge({
      query,
      limit: 20
    });
    return results;
  } catch (error) {
    console.error('Knowledge search failed:', error);
    
    // Fallback to cached results or show error message
    return knowledgeService.getCachedResults(query) || {
      results: [],
      error: 'Knowledge search temporarily unavailable'
    };
  }
};
```

## ✅ Verification Checklist

Before going live, verify:

- [ ] Environment variables configured correctly
- [ ] Firebase Functions deployed successfully  
- [ ] Firestore security rules updated
- [ ] Test ingestion completes without errors
- [ ] Search function returns relevant results
- [ ] Mobile app can access knowledge service
- [ ] Performance meets requirements (< 2s search response)
- [ ] Error handling works correctly
- [ ] Monitoring and logging configured

## 🔄 Next Steps

After setup is complete:

1. **Run Initial Ingestion**: Start with a small batch to verify everything works
2. **Schedule Regular Updates**: Set up automated daily ingestion
3. **Monitor Performance**: Watch logs and metrics for the first week
4. **Optimize Configuration**: Adjust quality thresholds based on results
5. **Scale Gradually**: Increase batch sizes as system proves stable

## 💡 Pro Tips

- **Start Small**: Begin with 50-100 items to test the full pipeline
- **Monitor Quality**: Regularly review quality scores and adjust thresholds
- **Cache Aggressively**: Use caching to improve mobile app performance  
- **Document Changes**: Keep track of configuration changes and their impact
- **Test Regularly**: Run weekly tests to catch issues early

---

Need help? Check the main README.md or contact the development team.