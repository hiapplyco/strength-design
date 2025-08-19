# RAG Integration Deployment Checklist

## Overview
This checklist ensures the RAG (Retrieval-Augmented Generation) system is properly deployed and configured in the Strength.Design fitness app.

## ✅ Pre-deployment Setup

### 1. Knowledge Base Preparation
- [ ] Knowledge ingestion pipeline is running
- [ ] Vector embeddings are generated for all knowledge content
- [ ] Firebase Firestore collections exist:
  - [ ] `knowledge` - Main knowledge content
  - [ ] `knowledge_embeddings` - Vector embeddings
- [ ] Knowledge content includes fitness-relevant sources
- [ ] Quality scores are calculated and stored

### 2. Firebase Functions
- [ ] `ragUtils.ts` is deployed
- [ ] `enhancedChat.ts` includes RAG integration
- [ ] Gemini API key is configured as a secret:
  ```bash
  firebase functions:config:set gemini.api_key="YOUR_API_KEY"
  ```
- [ ] Functions have appropriate memory allocation (1GiB recommended)
- [ ] Functions have appropriate timeout (300s recommended)

### 3. Dependencies
- [ ] `@google/generative-ai` package is installed
- [ ] All required Firebase packages are up to date
- [ ] TypeScript compilation is successful

## 🚀 Deployment Steps

### 1. Deploy Firebase Functions
```bash
cd functions
npm run build
firebase deploy --only functions:enhancedChat
```

### 2. Deploy Knowledge Functions (if needed)
```bash
firebase deploy --only functions:semanticSearch
firebase deploy --only functions:generateEmbeddings
```

### 3. Mobile App Updates
- [ ] Enhanced chat screen includes source citation UI
- [ ] Request payload includes RAG configuration
- [ ] Response handling processes knowledge sources
- [ ] UI styles for source citations are added

## 🧪 Testing

### 1. Local Testing
- [ ] Firebase emulators are running
- [ ] Test script runs successfully:
  ```bash
  node test-rag-integration.js
  ```
- [ ] Knowledge retrieval returns relevant results
- [ ] Source citations are properly formatted

### 2. Integration Testing
- [ ] Chat responses include knowledge context when relevant
- [ ] Source citations appear in mobile UI
- [ ] Non-fitness queries don't trigger RAG retrieval
- [ ] Error handling works when knowledge base is unavailable

### 3. Performance Testing
- [ ] Response times are acceptable (< 10s)
- [ ] Token usage is within limits
- [ ] Memory usage is stable
- [ ] No rate limiting issues with Gemini API

## 📊 Monitoring

### 1. Logging
- [ ] RAG retrieval events are logged
- [ ] Knowledge source usage is tracked
- [ ] Error rates are monitored
- [ ] Performance metrics are collected

### 2. Analytics
- [ ] Track knowledge source effectiveness
- [ ] Monitor user engagement with citations
- [ ] Measure response relevance scores
- [ ] Track RAG vs non-RAG response quality

## 🔧 Configuration

### 1. RAG Parameters
Default configuration in mobile app:
```javascript
ragConfig: {
  maxChunks: 5,        // Maximum knowledge chunks to retrieve
  maxTokens: 4000,     // Maximum tokens for knowledge context
  minRelevance: 0.5    // Minimum similarity threshold
}
```

### 2. Session Type Filters
- `workout` session: exercise, routine, guide content
- `nutrition` session: nutrition, guide content  
- `general` session: all content types

### 3. Quality Thresholds
- Minimum quality score: 0.6
- Similarity threshold: 0.5
- Maximum sources displayed: 3

## 🚨 Troubleshooting

### Common Issues

1. **No knowledge sources returned**
   - Check if embeddings exist in `knowledge_embeddings` collection
   - Verify Gemini embedding model is accessible
   - Check similarity threshold settings

2. **Source citations not displaying**
   - Verify mobile app UI code is deployed
   - Check response payload structure
   - Ensure knowledgeSources array is populated

3. **Slow response times**
   - Reduce maxChunks or maxTokens
   - Optimize candidate filtering
   - Check Firebase function memory allocation

4. **API errors**
   - Verify Gemini API key is configured
   - Check API quotas and rate limits
   - Monitor function timeout settings

## 📝 Success Criteria

### Functional Requirements
- [ ] Relevant fitness questions trigger knowledge retrieval
- [ ] Source citations display correctly in mobile UI
- [ ] General conversation works without RAG
- [ ] Error handling prevents chat disruption

### Performance Requirements
- [ ] 95% of responses under 10 seconds
- [ ] Knowledge retrieval accuracy > 80%
- [ ] Source relevance scores > 70%
- [ ] Zero critical errors in production

### User Experience
- [ ] Source citations are visually appealing
- [ ] Links to original sources work
- [ ] Knowledge enhances response quality
- [ ] System feels seamless and natural

## 🔄 Maintenance

### Regular Tasks
- [ ] Monitor knowledge base freshness
- [ ] Update embeddings for new content
- [ ] Review and tune RAG parameters
- [ ] Clean up old or irrelevant knowledge

### Performance Optimization
- [ ] Analyze slow queries and optimize
- [ ] Review token usage patterns
- [ ] Optimize vector similarity calculations
- [ ] Cache frequently accessed knowledge

---

**Deployment Date:** ___________
**Deployed By:** ___________
**Verified By:** ___________

## 📋 Sign-off

- [ ] Technical Lead Approval
- [ ] QA Testing Complete
- [ ] Performance Benchmarks Met
- [ ] Ready for Production Release