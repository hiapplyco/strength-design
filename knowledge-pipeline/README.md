# Strength.Design Knowledge Pipeline

A comprehensive fitness knowledge ingestion and processing system that powers the AI-driven features of the Strength.Design fitness app.

## 🎯 Overview

The Knowledge Pipeline extracts, processes, and serves fitness content from multiple sources to enhance the app's AI capabilities. It ingests content from Reddit fitness communities and Wikipedia fitness pages, processes it using AI for quality assessment and categorization, and makes it searchable through the mobile app.

## 🏗️ Architecture

```
knowledge-pipeline/
├── src/
│   ├── fitness-ingestor.ts          # Main ingestion script
│   ├── ingestors/                   # Source-specific ingestors
│   ├── processors/                  # Content processing utilities  
│   └── utils/                       # Shared utilities
├── config/
│   └── fitness-sources.json         # Source configuration
├── data/                           # Output data storage
├── logs/                           # Application logs
└── docs/                           # Documentation

Firebase Functions:
functions/src/knowledge/
├── ingestKnowledge.ts              # Ingest processed content
├── searchKnowledge.ts              # Search knowledge base
├── processKnowledgeContent.ts      # AI enhancement
├── getKnowledgeStats.ts            # Analytics
└── updateKnowledgeIndex.ts         # Index management

Mobile Integration:
mobile/services/KnowledgeService.js  # Client-side access
```

## 🚀 Quick Start

### 1. Setup Environment

```bash
cd knowledge-pipeline
npm install
cp .env.example .env
# Edit .env with your credentials
```

### 2. Configure Sources

Edit `config/fitness-sources.json` to customize:
- Reddit subreddits to monitor
- Wikipedia categories and search terms
- Quality thresholds and filters
- Processing options

### 3. Run Ingestion

```bash
# Ingest from Reddit
npm run ingest:reddit

# Ingest from Wikipedia  
npm run ingest:wikipedia

# Ingest from all sources
npm run ingest:all

# Test run (small dataset)
npm run ingest:test
```

### 4. Upload to Firebase

```bash
# Upload processed content
npx ts-node src/utils/firebase-uploader.ts -f data/fitness-knowledge.jsonl
```

## 📊 Data Sources

### Reddit Sources
- **r/fitness** - General fitness discussions
- **r/bodyweightfitness** - Calisthenics and bodyweight training
- **r/weightroom** - Strength training and powerlifting
- **r/nutrition** - Diet and nutrition advice
- **r/flexibility** - Stretching and mobility
- **r/xxfitness** - Women-focused fitness content
- **r/homegym** - Home workout setups
- Plus 15+ additional fitness subreddits

### Wikipedia Sources
- Exercise categories (Physical_exercises, Weight_training_exercises, etc.)
- Sports science and physiology articles
- Nutrition and sports medicine content
- Exercise technique and form guides

## 🔄 Content Processing Pipeline

### 1. Ingestion Phase
```typescript
// Extract raw content
const rawContent = await ingestor.ingestFromReddit(100);

// Apply quality filters
const filteredContent = rawContent.filter(item => 
  item.quality_score >= 0.6 && 
  containsFitnessKeywords(item.content)
);
```

### 2. Enhancement Phase
```typescript
// AI-powered content enhancement
const enhancedContent = await processKnowledgeContent({
  content_ids: ['reddit_123', 'wikipedia_456'],
  processing_type: 'enhance',
  options: { generate_summaries: true }
});
```

### 3. Indexing Phase
```typescript
// Build search indexes
await updateKnowledgeIndex({
  operation: 'rebuild',
  options: { batch_size: 50 }
});
```

## 🔍 Search & Retrieval

### Mobile App Integration

```javascript
import { knowledgeService } from '../services/KnowledgeService';

// Search knowledge base
const results = await knowledgeService.searchKnowledge({
  query: 'deadlift form',
  filters: {
    content_type: ['exercise', 'guide'],
    min_quality_score: 0.7
  },
  limit: 20,
  sort: 'relevance'
});

// Get knowledge by category
const exercises = await knowledgeService.getKnowledgeByType('exercise', 10);

// Get high-quality content
const topContent = await knowledgeService.getHighQualityKnowledge(15);
```

### Firebase Functions

```typescript
// Server-side search (called by mobile app)
const searchResults = await searchKnowledge({
  query: 'strength training',
  filters: {
    source: ['reddit', 'wikipedia'],
    content_type: ['routine', 'guide'],
    tags: ['strength', 'powerlifting']
  }
});
```

## 📈 Quality Assessment

### Quality Score Calculation
Each piece of content receives a quality score (0-1) based on:

1. **Content Length** (20% weight)
   - Optimal: 200-2000 characters
   - Bonus for well-structured content

2. **Source Credibility** (25% weight)
   - Wikipedia: +0.2 base score
   - Reddit: Score based on upvotes and subreddit quality

3. **Fitness Relevance** (30% weight)
   - Keywords: exercise, workout, training, nutrition, etc.
   - Technical terms: reps, sets, form, technique

4. **Community Engagement** (15% weight - Reddit only)
   - Upvote ratio, comment count
   - Author reputation in fitness communities

5. **AI Enhancement** (10% weight)
   - Bonus for AI-generated summaries
   - Structured data extraction

### Content Classification

Content is automatically categorized into:
- **Exercise**: Specific movement instructions
- **Routine**: Workout programs and schedules  
- **Nutrition**: Diet and supplement advice
- **Guide**: How-to tutorials and explanations
- **Science**: Research and physiology content
- **Discussion**: Community Q&A and experiences

## 🛠️ Available Scripts

### Data Ingestion
```bash
npm run ingest:reddit         # Reddit content only
npm run ingest:wikipedia      # Wikipedia content only  
npm run ingest:all           # All sources
npm run ingest:test          # Small test dataset
```

### Content Processing
```bash
npm run process:enhance      # AI enhancement
npm run process:categorize   # Content categorization
```

### Data Management
```bash
npm run upload:firebase      # Upload to Firestore
npm run stats               # Generate statistics
npm run clean               # Clean temporary files
```

### Development
```bash
npm run build               # TypeScript compilation
npm run test                # Run test suite
npm run lint                # Code linting
npm run format              # Code formatting
```

## 🔧 Configuration

### Environment Variables

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=firebase-admin@yourproject.iam.gserviceaccount.com

# Google AI / Gemini
GEMINI_API_KEY=your-gemini-api-key

# Processing Options
MAX_CONCURRENT_REQUESTS=5
DEFAULT_BATCH_SIZE=25
MIN_QUALITY_SCORE=0.6
```

### Source Configuration

Edit `config/fitness-sources.json`:

```json
{
  "reddit": {
    "subreddits": ["fitness", "bodyweightfitness"],
    "min_score": 10,
    "min_comments": 5,
    "lookback_days": 30
  },
  "wikipedia": {
    "search_terms": ["strength training", "cardio exercise"],
    "max_pages_per_term": 10
  },
  "processing": {
    "min_content_length": 100,
    "quality_filters": {
      "min_quality_score": 0.6,
      "require_exercise_keywords": true
    }
  }
}
```

## 📊 Analytics & Monitoring

### Knowledge Base Statistics

```typescript
// Get comprehensive stats
const stats = await getKnowledgeStats({
  include_details: true,
  date_range: {
    start: '2024-01-01',
    end: '2024-12-31'
  }
});

console.log(stats);
// {
//   total_items: 1250,
//   by_source: { reddit: 800, wikipedia: 450 },
//   by_content_type: { exercise: 300, routine: 200, ... },
//   average_quality_score: 0.74,
//   processing_status: { enhanced: 95%, categorized: 100% }
// }
```

### Performance Metrics

The pipeline tracks:
- Ingestion rates and success ratios
- Content quality distribution
- Processing completion rates  
- Search performance and usage
- Popular content categories

## 🚨 Error Handling & Recovery

### Automatic Recovery
- **Rate Limiting**: Automatic backoff for API limits
- **Deduplication**: Content hash-based duplicate detection
- **Retry Logic**: Exponential backoff for failed requests
- **Batch Processing**: Chunked uploads prevent timeouts

### Manual Recovery
```bash
# Retry failed ingestion
npm run ingest:reddit -- --retry-failed

# Clean and rebuild indexes
npx ts-node src/utils/firebase-uploader.ts --validate-only

# Re-process content with errors
npm run process:enhance -- --force-reprocess
```

## 🔄 Maintenance Tasks

### Daily Tasks (Automated)
```bash
# Scheduled via cron or Firebase Functions
npm run ingest:all -- --limit 50
npm run upload:firebase -- --skip-duplicates
```

### Weekly Tasks
```bash
# Clean up low-quality content
npx ts-node src/utils/firebase-uploader.ts --cleanup

# Rebuild search indexes
npm run process:reindex

# Generate analytics reports
npm run stats -- --detailed
```

### Monthly Tasks
```bash
# Full index rebuild
npm run process:rebuild-index

# Quality score recalculation
npm run process:recalculate-quality

# Archive old content
npm run archive:old-content
```

## 🤝 Integration with Mobile App

### KnowledgeService Usage

```javascript
// In your React Native component
import { knowledgeService } from '../services/KnowledgeService';

const WorkoutScreen = () => {
  const [knowledge, setKnowledge] = useState([]);

  useEffect(() => {
    const loadKnowledge = async () => {
      try {
        const results = await knowledgeService.searchKnowledge({
          query: 'deadlift',
          filters: { content_type: ['exercise', 'guide'] },
          limit: 10
        });
        setKnowledge(results.results);
      } catch (error) {
        console.error('Failed to load knowledge:', error);
      }
    };

    loadKnowledge();
  }, []);

  return (
    <View>
      {knowledge.map(item => (
        <KnowledgeCard key={item.id} item={item} />
      ))}
    </View>
  );
};
```

### AI Chat Integration

```javascript
// Enhance AI responses with knowledge base
const enhanceAIResponse = async (userQuery, aiResponse) => {
  const relatedKnowledge = await knowledgeService.searchKnowledge({
    query: userQuery,
    limit: 3,
    sort: 'quality'
  });

  return {
    aiResponse,
    supportingContent: relatedKnowledge.results,
    sources: relatedKnowledge.results.map(item => ({
      title: item.title,
      url: item.url,
      source: item.source
    }))
  };
};
```

## 🔐 Security & Privacy

### Data Protection
- **No Personal Information**: Only public fitness content
- **Content Attribution**: Proper source linking and attribution
- **Rate Limiting**: Respectful API usage
- **Terms Compliance**: Adherence to platform terms of service

### Firebase Security
- **Authentication Required**: All functions require user authentication
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Per-user and global rate limits
- **Error Sanitization**: No sensitive data in error messages

## 🧪 Testing

### Unit Tests
```bash
npm test                    # Run all tests
npm test -- --watch       # Watch mode
npm test -- --coverage    # Coverage report
```

### Integration Tests
```bash
# Test ingestion pipeline
npm run test:ingestion

# Test Firebase integration
npm run test:firebase

# Test search functionality
npm run test:search
```

### Performance Tests
```bash
# Load testing
npm run test:load

# Memory usage analysis
npm run test:memory
```

## 📝 Contributing

### Adding New Sources

1. Create source-specific ingestor in `src/ingestors/`
2. Add configuration in `config/fitness-sources.json`
3. Update main ingestor to include new source
4. Add tests for new functionality

### Improving Quality Assessment

1. Modify `calculateQualityScore()` in fitness-ingestor.ts
2. Update quality thresholds in configuration
3. Re-process existing content with new scores
4. Validate improvements with test dataset

### Enhancing Search

1. Extend search filters in `searchKnowledge.ts`
2. Add new ranking algorithms
3. Update mobile KnowledgeService
4. Test search performance and relevance

## 🆘 Troubleshooting

### Common Issues

**Ingestion Failures**
```bash
# Check API credentials
npm run test:credentials

# Verify network connectivity
curl -I https://www.reddit.com/r/fitness.json

# Check rate limiting
tail -f logs/combined.log | grep "rate"
```

**Upload Errors**
```bash
# Validate data format
npm run validate:data data/fitness-knowledge.jsonl

# Test Firebase connection
npm run test:firebase-connection

# Check Firestore rules
firebase firestore:rules:get
```

**Search Problems**
```bash
# Rebuild search index
npm run process:rebuild-index

# Check index status
npm run stats -- --index-details

# Test search function directly
npm run test:search "deadlift form"
```

## 📚 Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Reddit API Guidelines](https://www.reddit.com/wiki/api)
- [Wikipedia API Documentation](https://www.mediawiki.org/wiki/API:Main_page)
- [Gemini AI Documentation](https://ai.google.dev/docs)

## 📄 License

This project is part of the Strength.Design fitness application. All rights reserved.

---

For questions or support, contact the Strength.Design development team.