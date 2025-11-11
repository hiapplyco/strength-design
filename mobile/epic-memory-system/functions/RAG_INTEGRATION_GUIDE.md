# RAG Integration Guide - Strength.Design

## Overview

This guide documents the Retrieval-Augmented Generation (RAG) system integrated into the Strength.Design fitness app. The RAG system enhances AI chat responses by retrieving relevant information from a curated fitness knowledge base and providing source citations for transparency and credibility.

## Architecture

### High-Level Flow
```
User Query → Knowledge Retrieval → Context Injection → AI Response → Source Citations
```

### Components

1. **Knowledge Base**
   - Curated fitness content from Reddit and Wikipedia
   - Stored in Firebase Firestore
   - Includes exercises, routines, nutrition, and scientific information

2. **Vector Embeddings**
   - Generated using Gemini text-embedding-004 model
   - Stored in `knowledge_embeddings` collection
   - Used for semantic similarity search

3. **RAG Utils (`ragUtils.ts`)**
   - Core retrieval and context building logic
   - Semantic search implementation
   - Context window management

4. **Enhanced Chat Function**
   - Modified `enhancedChat.ts` to include RAG capabilities
   - Parallel retrieval and generation for optimal latency
   - Graceful fallback when knowledge base is unavailable

5. **Mobile UI**
   - Enhanced chat screen with source citation display
   - Interactive source links
   - RAG metadata indicators

## Implementation Details

### 1. Knowledge Retrieval Process

```typescript
// 1. Generate query embedding
const queryEmbedding = await generateQueryEmbedding(userQuery);

// 2. Find candidate embeddings with filters
const candidates = await getCandidateEmbeddings(filters, maxCandidates);

// 3. Calculate cosine similarities
const similarities = calculateSimilarities(queryEmbedding, candidates);

// 4. Retrieve full knowledge content
const knowledgeChunks = await getKnowledgeContent(topMatches);

// 5. Build context within token limits
const ragResponse = buildRAGContext(knowledgeChunks, maxTokens);
```

### 2. Context Injection

The system intelligently builds context by:
- Prioritizing high-relevance and high-quality sources
- Managing token limits to stay within AI model constraints
- Using summaries when full content exceeds limits
- Formatting context for optimal AI comprehension

### 3. Source Attribution

Every RAG-enhanced response includes:
- Source titles and URLs
- Content type and source platform
- Relevance scores
- Number of knowledge chunks used

### 4. Smart Filtering

Content filtering based on session type:
- **Workout sessions**: exercise, routine, guide content
- **Nutrition sessions**: nutrition, guide content
- **General sessions**: all content types

## Configuration

### RAG Parameters

```typescript
interface RAGConfig {
  maxChunks: number;        // Default: 5
  maxTokens: number;        // Default: 4000
  minRelevance: number;     // Default: 0.5
}
```

### Quality Thresholds

- **Minimum quality score**: 0.6 (filters low-quality content)
- **Similarity threshold**: 0.5 (ensures relevance)
- **Maximum displayed sources**: 3 (UI clarity)

### Session Type Filters

```typescript
const contentTypeFilters = {
  nutrition: ['nutrition', 'guide'],
  workout: ['exercise', 'routine', 'guide'],
  general: undefined // All types
};
```

## API Reference

### Enhanced Chat Request

```typescript
POST /enhancedChat
{
  message: string;
  history: ChatMessage[];
  sessionType: 'workout' | 'nutrition' | 'general';
  useRAG: boolean;
  ragConfig: {
    maxChunks: number;
    maxTokens: number;
    minRelevance: number;
  };
}
```

### Enhanced Chat Response

```typescript
{
  response: string;
  sessionId: string;
  contextUsed: {
    workouts: number;
    nutrition: number;
    files: number;
    knowledgeBase: number;
  };
  knowledgeSources: Array<{
    title: string;
    url: string;
    type: string;
    relevance: string;
  }>;
  ragMetadata: {
    chunksUsed: number;
    tokensUsed: number;
    retrievalEnabled: boolean;
  } | null;
}
```

## Knowledge Base Schema

### Knowledge Collection

```typescript
interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  summary?: string;
  source: 'reddit' | 'wikipedia';
  content_type: 'exercise' | 'routine' | 'nutrition' | 'discussion' | 'guide' | 'science';
  quality_score: number;
  tags: string[];
  url: string;
  created_at: string;
}
```

### Knowledge Embeddings Collection

```typescript
interface KnowledgeEmbedding {
  id: string; // Matches knowledge document ID
  embedding: number[]; // 768-dimensional vector
  content_type: string;
  source: string;
  quality_score: number;
  created_at: string;
}
```

## Mobile UI Integration

### Source Citation Display

```jsx
{message.knowledgeSources && message.knowledgeSources.length > 0 && (
  <View style={styles.sourcesContainer}>
    <Text style={styles.sourcesHeader}>Sources:</Text>
    {message.knowledgeSources.map((source, index) => (
      <TouchableOpacity key={index} style={styles.sourceItem}>
        <Text style={styles.sourceTitle}>📄 {source.title}</Text>
        <Text style={styles.sourceDetails}>
          {source.type} • {source.relevance}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
)}
```

### RAG Metadata Indicator

```jsx
{message.ragMetadata && (
  <Text style={styles.ragMetadata}>
    Knowledge base: {message.ragMetadata.chunksUsed} sources used
  </Text>
)}
```

## Performance Optimizations

### 1. Parallel Processing
- Knowledge retrieval happens in parallel with user context fetching
- Non-blocking approach prevents chat disruption

### 2. Smart Caching
- Candidate embeddings are cached temporarily
- Frequent queries leverage existing calculations

### 3. Token Management
- Progressive content inclusion based on available tokens
- Summary fallback for large content pieces
- Buffer allocation for formatting overhead

### 4. Error Resilience
- Graceful degradation when knowledge base is unavailable
- Fallback to standard chat without RAG
- Comprehensive error logging for debugging

## Quality Assurance

### Content Quality Scoring

```typescript
function calculateQualityScore(content: ProcessedContent): number {
  let score = 0.5; // Base score
  
  // Content length optimization
  if (length >= 200 && length <= 2000) score += 0.2;
  
  // Fitness keyword presence
  const keywordMatches = fitnessKeywords.filter(keyword => 
    contentLower.includes(keyword)
  ).length;
  score += Math.min(keywordMatches * 0.05, 0.3);
  
  // Source-specific scoring
  if (source === 'wikipedia') score += 0.2;
  
  return Math.min(score, 1.0);
}
```

### Relevance Validation

- Cosine similarity threshold enforcement
- Hybrid scoring combining semantic and keyword matching
- Content type filtering for session relevance

## Monitoring and Analytics

### Key Metrics

1. **Retrieval Performance**
   - Average retrieval time
   - Knowledge base hit rate
   - Relevance score distribution

2. **User Engagement**
   - Source citation click rates
   - RAG-enhanced vs standard response satisfaction
   - Knowledge source usage patterns

3. **System Health**
   - Error rates and types
   - Token usage patterns
   - Memory and performance metrics

### Logging Events

```typescript
// RAG retrieval initiated
logger.info('Knowledge retrieval started', { query, sessionType });

// Sources retrieved
logger.info('Knowledge sources found', { 
  totalSources: sources.length,
  avgRelevance: averageRelevance 
});

// Response generated
logger.info('RAG response complete', {
  tokensUsed: ragResponse.tokensUsed,
  sourcesUsed: ragResponse.totalChunks
});
```

## Best Practices

### 1. Content Curation
- Regular quality audits of knowledge base
- Removal of outdated or incorrect information
- Continuous addition of high-quality sources

### 2. Parameter Tuning
- Monitor relevance scores and adjust thresholds
- Optimize token allocation based on usage patterns
- Balance response speed with information richness

### 3. User Experience
- Keep source citations concise and actionable
- Provide clear visual distinction for RAG-enhanced responses
- Allow users to provide feedback on source relevance

### 4. Privacy and Safety
- No personal user data in knowledge base
- Content moderation for safety and accuracy
- Clear attribution and respect for source copyrights

## Troubleshooting

### Common Issues

1. **Empty Knowledge Retrieval**
   ```
   Symptoms: No sources returned for relevant queries
   Causes: Missing embeddings, threshold too high, API issues
   Solutions: Check embedding generation, lower thresholds, verify API keys
   ```

2. **Slow Response Times**
   ```
   Symptoms: Chat responses take >10 seconds
   Causes: Large knowledge base, inefficient queries, token limits
   Solutions: Optimize filtering, reduce maxChunks, improve indexing
   ```

3. **Irrelevant Sources**
   ```
   Symptoms: Low-quality or off-topic sources returned
   Causes: Poor quality scoring, loose similarity thresholds
   Solutions: Improve content curation, adjust relevance thresholds
   ```

4. **UI Display Issues**
   ```
   Symptoms: Source citations not showing or malformed
   Causes: Missing UI code, data format issues
   Solutions: Check response structure, verify UI rendering logic
   ```

## Future Enhancements

### 1. Advanced Features
- User feedback integration for relevance tuning
- Personalized knowledge recommendations
- Multi-modal content support (images, videos)

### 2. Performance Improvements
- Vector database migration for better performance
- Caching layer for frequent queries
- Async background updates for knowledge base

### 3. Content Expansion
- Integration with additional fitness databases
- Real-time content ingestion
- User-generated content inclusion

---

**Last Updated:** [Current Date]
**Version:** 1.0
**Maintainer:** Development Team