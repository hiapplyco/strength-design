/**
 * Knowledge Processing Functions
 * 
 * Firebase Functions for processing and serving fitness knowledge content
 * Includes vector embeddings and semantic search capabilities
 */

export { ingestKnowledge } from './ingestKnowledge';
export { searchKnowledge } from './searchKnowledge';
export { processKnowledgeContent } from './processKnowledgeContent';
export { getKnowledgeStats } from './getKnowledgeStats';
export { updateKnowledgeIndex } from './updateKnowledgeIndex';

// Vector embedding functions
export { generateEmbeddings, generateAllMissingEmbeddings } from './generateEmbeddings';
export { semanticSearch, findSimilarContent } from './semanticSearch';

// Batch processing functions
export { 
  batchProcessEmbeddings, 
  scheduledEmbeddingProcessor,
  getEmbeddingProcessingStats,
  cleanupEmbeddings 
} from './batchEmbeddingProcessor';

// Utility exports
export * from './embeddingUtils';