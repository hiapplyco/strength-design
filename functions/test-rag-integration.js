#!/usr/bin/env node

/**
 * RAG Integration Test Script
 * 
 * Tests the RAG integration with the enhancedChat function
 * This script simulates a chat request to verify that:
 * 1. Knowledge retrieval works
 * 2. Source attribution is included
 * 3. Context window management is functioning
 */

const axios = require('axios');

// Configuration
const FUNCTIONS_URL = 'http://localhost:5001/demo-strength-design/us-central1'; // Firebase emulator
const TEST_USER_TOKEN = 'test-token'; // Mock token for local testing

// Test cases
const testCases = [
  {
    name: 'Basic fitness question',
    message: 'What are the best exercises for building chest muscle?',
    expectedSources: true
  },
  {
    name: 'Nutrition question',
    message: 'How much protein should I eat after a workout?',
    sessionType: 'nutrition',
    expectedSources: true
  },
  {
    name: 'Specific exercise form',
    message: 'How do I perform a proper deadlift?',
    sessionType: 'workout',
    expectedSources: true
  },
  {
    name: 'General greeting',
    message: 'Hello, how are you today?',
    expectedSources: false
  }
];

async function testRAGIntegration() {
  console.log('🚀 Starting RAG Integration Tests...\n');

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`);
    console.log(`   Query: "${testCase.message}"`);
    
    try {
      const response = await axios.post(`${FUNCTIONS_URL}/enhancedChat`, {
        message: testCase.message,
        history: [],
        sessionType: testCase.sessionType || 'general',
        uploadedFiles: [],
        useRAG: true,
        ragConfig: {
          maxChunks: 3,
          maxTokens: 2000,
          minRelevance: 0.5
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_USER_TOKEN}`
        },
        timeout: 30000
      });

      const result = response.data;
      
      // Validate response structure
      if (!result.response) {
        throw new Error('No response field in result');
      }

      console.log(`   ✅ Response received (${result.response.length} chars)`);
      
      // Check knowledge sources
      if (testCase.expectedSources) {
        if (result.knowledgeSources && result.knowledgeSources.length > 0) {
          console.log(`   📚 Knowledge sources: ${result.knowledgeSources.length}`);
          result.knowledgeSources.forEach((source, index) => {
            console.log(`      ${index + 1}. ${source.title} (${source.relevance})`);
          });
        } else {
          console.log(`   ⚠️  Expected sources but none found`);
        }
      } else {
        console.log(`   ✅ No sources expected (general query)`);
      }

      // Check RAG metadata
      if (result.ragMetadata) {
        console.log(`   🔍 RAG metadata: ${result.ragMetadata.chunksUsed} chunks, ${result.ragMetadata.tokensUsed} tokens`);
      }

      console.log(`   📊 Context used:`, result.contextUsed);
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
      if (error.response) {
        console.log(`      Status: ${error.response.status}`);
        console.log(`      Error: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    
    console.log(''); // Empty line between tests
  }
}

async function testKnowledgeRetrieval() {
  console.log('🔍 Testing Direct Knowledge Retrieval...\n');
  
  try {
    const response = await axios.post(`${FUNCTIONS_URL}/semanticSearch`, {
      query: 'deadlift exercise form technique',
      limit: 3,
      similarity_threshold: 0.5,
      hybrid_search: true
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const result = response.data;
    
    console.log(`✅ Semantic search completed`);
    console.log(`   📚 Results: ${result.results?.length || 0}`);
    console.log(`   ⏱️  Processing time: ${result.processing_time}ms`);
    
    if (result.results && result.results.length > 0) {
      result.results.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} (${(item.similarity_score * 100).toFixed(1)}% relevant)`);
        console.log(`      Source: ${item.source} | Type: ${item.content_type}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Knowledge retrieval test failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || 'Unknown error'}`);
    }
  }
}

async function main() {
  console.log('🎯 RAG Integration Test Suite');
  console.log('==============================\n');
  
  // Check if Firebase emulator is running
  try {
    await axios.get(`${FUNCTIONS_URL}/enhancedChat`, { timeout: 5000 });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Firebase emulator not running. Please start it first:');
      console.log('   cd functions && firebase emulators:start\n');
      process.exit(1);
    }
  }
  
  // Test direct knowledge retrieval first
  await testKnowledgeRetrieval();
  console.log('\n');
  
  // Test RAG integration with chat
  await testRAGIntegration();
  
  console.log('🏁 Tests completed!');
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRAGIntegration, testKnowledgeRetrieval };