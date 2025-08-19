#!/usr/bin/env ts-node

/**
 * Firebase Uploader Utility
 * 
 * Uploads processed knowledge content to Firebase Firestore
 * Handles batch uploads, deduplication, and error recovery
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Command } from 'commander';
import winston from 'winston';

interface KnowledgeItem {
  id: string;
  source: string;
  title: string;
  content: string;
  url: string;
  metadata: Record<string, any>;
  quality_score: number;
  content_hash: string;
  created_at: string;
  tags: string[];
  content_type: string;
}

class FirebaseUploader {
  private db: FirebaseFirestore.Firestore;
  private logger: winston.Logger;

  constructor() {
    this.initializeFirebase();
    this.db = getFirestore();
    this.logger = this.setupLogger();
  }

  private initializeFirebase() {
    // Check if Firebase is already initialized
    if (getApps().length === 0) {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                                join(__dirname, '../../../firebase-service-account.json');
      
      if (existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        
        initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
        });
      } else {
        // Use environment variables
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID!,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
            privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
          })
        });
      }
    }
  }

  private setupLogger(): winston.Logger {
    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'firebase-uploader' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  /**
   * Upload knowledge items to Firebase
   */
  async uploadKnowledge(items: KnowledgeItem[], options: any = {}): Promise<any> {
    const {
      batchSize = 25,
      skipDuplicates = true,
      updateExisting = false,
      dryRun = false
    } = options;

    this.logger.info('Starting Firebase upload', {
      itemCount: items.length,
      batchSize,
      skipDuplicates,
      updateExisting,
      dryRun
    });

    const results = {
      total: items.length,
      uploaded: 0,
      skipped: 0,
      errors: 0,
      batches: 0,
      duplicates: 0,
      errorDetails: [] as any[]
    };

    // Process in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      try {
        const batchResult = await this.processBatch(
          batch, 
          skipDuplicates, 
          updateExisting, 
          dryRun
        );
        
        results.uploaded += batchResult.uploaded;
        results.skipped += batchResult.skipped;
        results.duplicates += batchResult.duplicates;
        results.errors += batchResult.errors;
        results.batches++;
        
        if (batchResult.errors > 0) {
          results.errorDetails.push(...batchResult.errorDetails);
        }

        this.logger.info(`Processed batch ${results.batches}`, {
          batchSize: batch.length,
          uploaded: batchResult.uploaded,
          skipped: batchResult.skipped,
          errors: batchResult.errors
        });

        // Small delay between batches to avoid overwhelming Firestore
        if (i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        this.logger.error(`Batch ${results.batches + 1} failed completely`, {
          error: error.message,
          batchStart: i
        });
        results.errors += batch.length;
      }
    }

    this.logger.info('Firebase upload completed', results);
    return results;
  }

  private async processBatch(
    items: KnowledgeItem[],
    skipDuplicates: boolean,
    updateExisting: boolean,
    dryRun: boolean
  ): Promise<any> {
    const batchResults = {
      uploaded: 0,
      skipped: 0,
      duplicates: 0,
      errors: 0,
      errorDetails: [] as any[]
    };

    if (dryRun) {
      this.logger.info('DRY RUN: Would upload batch', { itemCount: items.length });
      batchResults.uploaded = items.length;
      return batchResults;
    }

    const firestoreBatch = this.db.batch();
    const knowledgeCollection = this.db.collection('knowledge');

    for (const item of items) {
      try {
        const docRef = knowledgeCollection.doc(item.id);
        
        // Check if document exists
        const existingDoc = await docRef.get();
        
        if (existingDoc.exists) {
          if (skipDuplicates && !updateExisting) {
            batchResults.duplicates++;
            continue;
          } else if (updateExisting) {
            // Update existing document
            const updateData = this.prepareFirestoreData(item);
            updateData.updated_at = new Date();
            firestoreBatch.update(docRef, updateData);
            batchResults.uploaded++;
          } else {
            batchResults.duplicates++;
            continue;
          }
        } else {
          // Create new document
          const firestoreData = this.prepareFirestoreData(item);
          firestoreBatch.set(docRef, firestoreData);
          batchResults.uploaded++;
        }

      } catch (error) {
        this.logger.error(`Error processing item ${item.id}`, {
          error: error.message,
          itemId: item.id
        });
        batchResults.errors++;
        batchResults.errorDetails.push({
          id: item.id,
          error: error.message
        });
      }
    }

    // Commit the batch
    if (batchResults.uploaded > 0) {
      try {
        await firestoreBatch.commit();
      } catch (error) {
        this.logger.error('Failed to commit Firestore batch', {
          error: error.message
        });
        // Mark all uploaded items as errors
        batchResults.errors += batchResults.uploaded;
        batchResults.uploaded = 0;
        throw error;
      }
    }

    return batchResults;
  }

  private prepareFirestoreData(item: KnowledgeItem): any {
    return {
      source: item.source,
      title: item.title,
      content: item.content,
      url: item.url,
      metadata: item.metadata || {},
      quality_score: item.quality_score,
      content_hash: item.content_hash,
      created_at: new Date(item.created_at),
      tags: item.tags || [],
      content_type: item.content_type,
      
      // Additional search fields
      search_keywords: this.generateSearchKeywords(item),
      searchable_text: this.generateSearchableText(item),
      
      // Timestamps
      uploaded_at: new Date(),
      indexed_at: new Date()
    };
  }

  private generateSearchKeywords(item: KnowledgeItem): string[] {
    const keywords = new Set<string>();

    // Add title words
    if (item.title) {
      const titleWords = item.title.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2);
      titleWords.forEach(word => keywords.add(word));
    }

    // Add tags
    if (item.tags) {
      item.tags.forEach(tag => keywords.add(tag.toLowerCase()));
    }

    // Add content type and source
    keywords.add(item.content_type);
    keywords.add(item.source);

    return Array.from(keywords);
  }

  private generateSearchableText(item: KnowledgeItem): string {
    const parts = [];
    
    if (item.title) parts.push(item.title);
    if (item.content) parts.push(item.content.substring(0, 1000)); // Limit for Firestore
    if (item.tags) parts.push(item.tags.join(' '));

    return parts.join(' ').toLowerCase();
  }

  /**
   * Load knowledge items from file
   */
  loadKnowledgeFromFile(filePath: string): KnowledgeItem[] {
    try {
      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileContent = readFileSync(filePath, 'utf8');
      
      if (filePath.endsWith('.json')) {
        return JSON.parse(fileContent);
      } else if (filePath.endsWith('.jsonl')) {
        return fileContent
          .split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line));
      } else {
        throw new Error('Unsupported file format. Use .json or .jsonl');
      }

    } catch (error) {
      this.logger.error('Failed to load knowledge from file', {
        filePath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate knowledge items before upload
   */
  validateKnowledgeItems(items: KnowledgeItem[]): any {
    const validation = {
      valid: 0,
      invalid: 0,
      errors: [] as any[]
    };

    const requiredFields = ['id', 'source', 'title', 'content', 'content_type', 'quality_score'];

    items.forEach((item, index) => {
      const itemErrors = [];

      // Check required fields
      requiredFields.forEach(field => {
        if (!item[field as keyof KnowledgeItem]) {
          itemErrors.push(`Missing required field: ${field}`);
        }
      });

      // Validate content length
      if (item.content && item.content.length < 50) {
        itemErrors.push('Content too short (< 50 characters)');
      }

      // Validate quality score
      if (item.quality_score < 0 || item.quality_score > 1) {
        itemErrors.push('Quality score must be between 0 and 1');
      }

      // Validate content type
      const validContentTypes = ['exercise', 'routine', 'nutrition', 'discussion', 'guide', 'science'];
      if (!validContentTypes.includes(item.content_type)) {
        itemErrors.push(`Invalid content type: ${item.content_type}`);
      }

      if (itemErrors.length > 0) {
        validation.invalid++;
        validation.errors.push({
          index,
          id: item.id,
          errors: itemErrors
        });
      } else {
        validation.valid++;
      }
    });

    return validation;
  }
}

// CLI Interface
async function main() {
  const program = new Command();
  
  program
    .name('firebase-uploader')
    .description('Upload fitness knowledge to Firebase Firestore')
    .version('1.0.0');

  program
    .requiredOption('-f, --file <path>', 'Path to knowledge data file (.json or .jsonl)')
    .option('-b, --batch-size <number>', 'Batch size for uploads', '25')
    .option('--skip-duplicates', 'Skip duplicate items', true)
    .option('--update-existing', 'Update existing items', false)
    .option('--dry-run', 'Perform a dry run without actual uploads', false)
    .option('--validate-only', 'Only validate the data without uploading', false)
    .parse();

  const options = program.opts();
  
  console.log('🚀 Starting Firebase Knowledge Upload...');
  console.log(`File: ${options.file}`);
  console.log(`Batch Size: ${options.batchSize}`);
  console.log(`Dry Run: ${options.dryRun}`);

  try {
    const uploader = new FirebaseUploader();
    
    // Load knowledge items
    console.log('📂 Loading knowledge items...');
    const items = uploader.loadKnowledgeFromFile(options.file);
    console.log(`✅ Loaded ${items.length} items`);

    // Validate items
    console.log('🔍 Validating knowledge items...');
    const validation = uploader.validateKnowledgeItems(items);
    console.log(`✅ Validation complete: ${validation.valid} valid, ${validation.invalid} invalid`);

    if (validation.invalid > 0) {
      console.log('❌ Validation errors found:');
      validation.errors.slice(0, 5).forEach((error: any) => {
        console.log(`  Item ${error.index} (${error.id}): ${error.errors.join(', ')}`);
      });
      
      if (validation.errors.length > 5) {
        console.log(`  ... and ${validation.errors.length - 5} more errors`);
      }
    }

    if (options.validateOnly) {
      console.log('✅ Validation complete. Exiting (validate-only mode).');
      return;
    }

    if (validation.valid === 0) {
      console.log('❌ No valid items to upload. Exiting.');
      return;
    }

    // Filter to valid items only
    const validItems = items.filter((item, index) => 
      !validation.errors.some((error: any) => error.index === index)
    );

    // Upload to Firebase
    console.log(`📤 Uploading ${validItems.length} valid items to Firebase...`);
    const uploadResult = await uploader.uploadKnowledge(validItems, {
      batchSize: parseInt(options.batchSize),
      skipDuplicates: options.skipDuplicates,
      updateExisting: options.updateExisting,
      dryRun: options.dryRun
    });

    console.log('\n📊 Upload Results:');
    console.log(`  Total: ${uploadResult.total}`);
    console.log(`  Uploaded: ${uploadResult.uploaded}`);
    console.log(`  Skipped: ${uploadResult.skipped}`);
    console.log(`  Duplicates: ${uploadResult.duplicates}`);
    console.log(`  Errors: ${uploadResult.errors}`);
    console.log(`  Batches: ${uploadResult.batches}`);

    if (uploadResult.errors > 0) {
      console.log('\n❌ Upload errors:');
      uploadResult.errorDetails.slice(0, 5).forEach((error: any) => {
        console.log(`  ${error.id}: ${error.error}`);
      });
    }

    console.log('\n✅ Upload process completed!');

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { FirebaseUploader };