#!/usr/bin/env ts-node

/**
 * Fitness Knowledge Ingestor
 * 
 * A comprehensive LLM context ingestion pipeline specifically designed for fitness content.
 * Pulls content from Reddit fitness communities and Wikipedia fitness/exercise pages.
 * 
 * Features:
 * - Reddit fitness subreddit scraping with content quality filtering
 * - Wikipedia exercise and nutrition page extraction
 * - Content deduplication and quality scoring
 * - Structured data extraction for exercises, routines, and nutrition
 * - Integration with Firebase Firestore for storage
 * 
 * Usage:
 *   npx ts-node src/fitness-ingestor.ts --source reddit --limit 100
 *   npx ts-node src/fitness-ingestor.ts --source wikipedia --categories exercises,nutrition
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { Command } from 'commander';
import winston from 'winston';

// Types
interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  score: number;
  num_comments: number;
  created_utc: number;
  subreddit: string;
  author: string;
  flair_text?: string;
  upvote_ratio: number;
}

interface WikipediaPage {
  pageid: number;
  title: string;
  extract: string;
  url: string;
  categories?: string[];
}

interface ProcessedContent {
  id: string;
  source: 'reddit' | 'wikipedia';
  title: string;
  content: string;
  url: string;
  metadata: Record<string, any>;
  quality_score: number;
  content_hash: string;
  created_at: string;
  tags: string[];
  content_type: 'exercise' | 'routine' | 'nutrition' | 'discussion' | 'guide' | 'science';
}

interface IngestorConfig {
  reddit: {
    subreddits: string[];
    post_types: string[];
    min_score: number;
    min_comments: number;
    lookback_days: number;
  };
  wikipedia: {
    categories: string[];
    search_terms: string[];
    max_pages_per_term: number;
  };
  processing: {
    min_content_length: number;
    max_content_length: number;
    dedupe_threshold: number;
    quality_filters: {
      min_quality_score: number;
      require_exercise_keywords: boolean;
      filter_promotional: boolean;
    };
  };
  output: {
    format: 'json' | 'jsonl' | 'csv';
    batch_size: number;
    include_metadata: boolean;
  };
}

class FitnessIngestor {
  private config: IngestorConfig;
  private logger: winston.Logger;
  private seenContent: Set<string> = new Set();
  private rateLimiter: Map<string, number> = new Map();

  constructor(configPath: string) {
    this.config = this.loadConfig(configPath);
    this.logger = this.setupLogger();
    this.setupRateLimiting();
  }

  private loadConfig(configPath: string): IngestorConfig {
    try {
      const configData = readFileSync(configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      this.logger?.warn(`Could not load config from ${configPath}, using defaults`);
      return this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): IngestorConfig {
    return {
      reddit: {
        subreddits: [
          'fitness', 'bodyweightfitness', 'weightroom', 'powerlifting',
          'strength_training', 'loseit', 'gainit', 'flexibility',
          'yoga', 'running', 'swimming', 'cycling', 'crossfit',
          'homegym', 'xxfitness', 'fitness30plus', 'flexibility'
        ],
        post_types: ['self', 'link'],
        min_score: 10,
        min_comments: 5,
        lookback_days: 30
      },
      wikipedia: {
        categories: [
          'Physical_exercises', 'Weight_training_exercises', 'Bodyweight_exercises',
          'Cardiovascular_exercise', 'Flexibility_exercises', 'Sports_nutrition',
          'Exercise_physiology', 'Strength_training', 'Aerobic_exercise'
        ],
        search_terms: [
          'strength training', 'cardio exercise', 'flexibility training',
          'bodyweight exercises', 'weight lifting', 'nutrition fitness',
          'exercise physiology', 'sports science', 'workout routines',
          'fitness training', 'muscle building', 'fat loss'
        ],
        max_pages_per_term: 10
      },
      processing: {
        min_content_length: 100,
        max_content_length: 10000,
        dedupe_threshold: 0.85,
        quality_filters: {
          min_quality_score: 0.6,
          require_exercise_keywords: true,
          filter_promotional: true
        }
      },
      output: {
        format: 'jsonl',
        batch_size: 100,
        include_metadata: true
      }
    };
  }

  private setupLogger(): winston.Logger {
    const logDir = join(dirname(__dirname), 'logs');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'fitness-ingestor' },
      transports: [
        new winston.transports.File({ 
          filename: join(logDir, 'error.log'), 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: join(logDir, 'combined.log') 
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  private setupRateLimiting(): void {
    // Reddit API: 60 requests per minute
    // Wikipedia API: No strict limit but be respectful
    setInterval(() => {
      this.rateLimiter.clear();
    }, 60000); // Reset every minute
  }

  private async waitForRateLimit(service: string): Promise<void> {
    const now = Date.now();
    const lastRequest = this.rateLimiter.get(service) || 0;
    const timeSinceLastRequest = now - lastRequest;
    
    let minInterval = 1000; // Default 1 second
    if (service === 'reddit') {
      minInterval = 1000; // 1 second between Reddit requests
    } else if (service === 'wikipedia') {
      minInterval = 500; // 0.5 seconds between Wikipedia requests
    }

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      this.logger.debug(`Rate limiting: waiting ${waitTime}ms for ${service}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.rateLimiter.set(service, Date.now());
  }

  /**
   * Ingest content from Reddit fitness subreddits
   */
  async ingestFromReddit(limit: number = 100): Promise<ProcessedContent[]> {
    this.logger.info('Starting Reddit ingestion', { 
      subreddits: this.config.reddit.subreddits,
      limit 
    });

    const allContent: ProcessedContent[] = [];
    const postsPerSubreddit = Math.ceil(limit / this.config.reddit.subreddits.length);

    for (const subreddit of this.config.reddit.subreddits) {
      try {
        await this.waitForRateLimit('reddit');
        
        const posts = await this.fetchRedditPosts(subreddit, postsPerSubreddit);
        const processedPosts = await this.processRedditPosts(posts);
        
        allContent.push(...processedPosts);
        
        this.logger.info(`Processed ${processedPosts.length} posts from r/${subreddit}`);
        
        // Small delay between subreddits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        this.logger.error(`Error processing r/${subreddit}`, { error: error.message });
        continue;
      }
    }

    this.logger.info(`Reddit ingestion complete`, { 
      totalContent: allContent.length,
      sources: this.config.reddit.subreddits.length
    });

    return allContent;
  }

  private async fetchRedditPosts(subreddit: string, limit: number): Promise<RedditPost[]> {
    const baseUrl = 'https://www.reddit.com';
    const url = `${baseUrl}/r/${subreddit}/top.json`;
    
    const params = {
      limit: Math.min(limit, 100), // Reddit API limit
      t: 'month', // Top posts from last month
      raw_json: 1
    };

    try {
      const response = await axios.get(url, { 
        params,
        headers: {
          'User-Agent': 'FitnessKnowledgeIngestor/1.0 (Strength.Design App)'
        },
        timeout: 10000
      });

      if (!response.data?.data?.children) {
        throw new Error('Invalid Reddit API response format');
      }

      const posts: RedditPost[] = response.data.data.children
        .map((child: any) => child.data)
        .filter((post: any) => this.isValidRedditPost(post));

      this.logger.debug(`Fetched ${posts.length} posts from r/${subreddit}`);
      return posts;

    } catch (error) {
      this.logger.error(`Failed to fetch from r/${subreddit}`, { 
        error: error.message,
        url 
      });
      throw error;
    }
  }

  private isValidRedditPost(post: any): boolean {
    return (
      post &&
      post.title &&
      post.selftext !== '[deleted]' &&
      post.selftext !== '[removed]' &&
      post.score >= this.config.reddit.min_score &&
      post.num_comments >= this.config.reddit.min_comments &&
      !post.over_18 && // No NSFW content
      !post.is_self === false // Include self posts primarily
    );
  }

  private async processRedditPosts(posts: RedditPost[]): Promise<ProcessedContent[]> {
    const processed: ProcessedContent[] = [];

    for (const post of posts) {
      try {
        const content = this.extractRedditContent(post);
        
        if (!content || this.isDuplicate(content.content)) {
          continue;
        }

        const qualityScore = this.calculateQualityScore(content);
        
        if (qualityScore >= this.config.processing.quality_filters.min_quality_score) {
          content.quality_score = qualityScore;
          processed.push(content);
          this.seenContent.add(content.content_hash);
        }

      } catch (error) {
        this.logger.warn(`Failed to process Reddit post ${post.id}`, { 
          error: error.message 
        });
        continue;
      }
    }

    return processed;
  }

  private extractRedditContent(post: RedditPost): ProcessedContent | null {
    const title = post.title?.trim();
    const content = post.selftext?.trim();
    
    if (!title || !content || content.length < this.config.processing.min_content_length) {
      return null;
    }

    const fullContent = `${title}\n\n${content}`;
    const contentHash = createHash('sha256').update(fullContent).digest('hex');
    
    return {
      id: `reddit_${post.id}`,
      source: 'reddit',
      title,
      content: fullContent,
      url: `https://reddit.com${post.permalink}`,
      metadata: {
        subreddit: post.subreddit,
        author: post.author,
        score: post.score,
        num_comments: post.num_comments,
        upvote_ratio: post.upvote_ratio,
        flair_text: post.flair_text,
        created_utc: post.created_utc
      },
      quality_score: 0, // Will be calculated later
      content_hash: contentHash,
      created_at: new Date().toISOString(),
      tags: this.extractTags(fullContent, post.flair_text),
      content_type: this.classifyContent(fullContent, post.flair_text)
    };
  }

  /**
   * Ingest content from Wikipedia fitness and exercise pages
   */
  async ingestFromWikipedia(limit: number = 50): Promise<ProcessedContent[]> {
    this.logger.info('Starting Wikipedia ingestion', { 
      categories: this.config.wikipedia.categories,
      search_terms: this.config.wikipedia.search_terms,
      limit 
    });

    const allContent: ProcessedContent[] = [];
    
    // First, search for pages using search terms
    for (const searchTerm of this.config.wikipedia.search_terms) {
      if (allContent.length >= limit) break;
      
      try {
        await this.waitForRateLimit('wikipedia');
        
        const pages = await this.searchWikipediaPages(
          searchTerm, 
          Math.min(this.config.wikipedia.max_pages_per_term, limit - allContent.length)
        );
        
        for (const page of pages) {
          if (allContent.length >= limit) break;
          
          await this.waitForRateLimit('wikipedia');
          const content = await this.fetchWikipediaContent(page);
          
          if (content) {
            allContent.push(content);
          }
        }
        
        this.logger.info(`Processed ${pages.length} pages for "${searchTerm}"`);
        
      } catch (error) {
        this.logger.error(`Error processing Wikipedia search "${searchTerm}"`, { 
          error: error.message 
        });
        continue;
      }
    }

    this.logger.info(`Wikipedia ingestion complete`, { 
      totalContent: allContent.length,
      searchTerms: this.config.wikipedia.search_terms.length
    });

    return allContent;
  }

  private async searchWikipediaPages(searchTerm: string, limit: number): Promise<WikipediaPage[]> {
    const baseUrl = 'https://en.wikipedia.org/w/api.php';
    
    const params = {
      action: 'query',
      list: 'search',
      srsearch: searchTerm,
      format: 'json',
      srlimit: limit,
      srinfo: 'totalhits',
      srprop: 'size|wordcount|timestamp'
    };

    try {
      const response = await axios.get(baseUrl, { 
        params,
        timeout: 10000
      });

      if (!response.data?.query?.search) {
        throw new Error('Invalid Wikipedia search response');
      }

      const pages: WikipediaPage[] = response.data.query.search.map((result: any) => ({
        pageid: result.pageid,
        title: result.title,
        extract: result.snippet || '',
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`
      }));

      this.logger.debug(`Found ${pages.length} Wikipedia pages for "${searchTerm}"`);
      return pages;

    } catch (error) {
      this.logger.error(`Failed to search Wikipedia for "${searchTerm}"`, { 
        error: error.message 
      });
      throw error;
    }
  }

  private async fetchWikipediaContent(page: WikipediaPage): Promise<ProcessedContent | null> {
    const baseUrl = 'https://en.wikipedia.org/w/api.php';
    
    const params = {
      action: 'query',
      prop: 'extracts|categories',
      exintro: false,
      explaintext: true,
      exsectionformat: 'wiki',
      pageids: page.pageid,
      format: 'json',
      cllimit: 50
    };

    try {
      const response = await axios.get(baseUrl, { 
        params,
        timeout: 15000
      });

      const pageData = response.data?.query?.pages?.[page.pageid];
      
      if (!pageData?.extract) {
        this.logger.warn(`No content found for Wikipedia page: ${page.title}`);
        return null;
      }

      const content = pageData.extract.trim();
      
      if (content.length < this.config.processing.min_content_length || 
          content.length > this.config.processing.max_content_length) {
        return null;
      }

      if (this.isDuplicate(content)) {
        return null;
      }

      const contentHash = createHash('sha256').update(content).digest('hex');
      const categories = pageData.categories?.map((cat: any) => cat.title) || [];
      
      const processedContent: ProcessedContent = {
        id: `wikipedia_${page.pageid}`,
        source: 'wikipedia',
        title: page.title,
        content: content,
        url: page.url,
        metadata: {
          pageid: page.pageid,
          categories: categories,
          content_length: content.length
        },
        quality_score: this.calculateQualityScore({
          content,
          title: page.title,
          source: 'wikipedia'
        } as ProcessedContent),
        content_hash: contentHash,
        created_at: new Date().toISOString(),
        tags: this.extractTags(content),
        content_type: this.classifyContent(content, null, categories)
      };

      this.seenContent.add(contentHash);
      return processedContent;

    } catch (error) {
      this.logger.error(`Failed to fetch Wikipedia content for ${page.title}`, { 
        error: error.message,
        pageid: page.pageid
      });
      return null;
    }
  }

  private isDuplicate(content: string): boolean {
    const contentHash = createHash('sha256').update(content).digest('hex');
    return this.seenContent.has(contentHash);
  }

  private calculateQualityScore(content: ProcessedContent): number {
    let score = 0.5; // Base score

    // Content length (optimal range: 200-2000 characters)
    const length = content.content.length;
    if (length >= 200 && length <= 2000) {
      score += 0.2;
    } else if (length > 2000 && length <= 5000) {
      score += 0.1;
    }

    // Fitness keyword presence
    const fitnessKeywords = [
      'exercise', 'workout', 'training', 'fitness', 'muscle', 'strength',
      'cardio', 'weight', 'rep', 'set', 'routine', 'form', 'technique',
      'nutrition', 'protein', 'diet', 'calories', 'recovery', 'flexibility'
    ];
    
    const contentLower = content.content.toLowerCase();
    const keywordMatches = fitnessKeywords.filter(keyword => 
      contentLower.includes(keyword)
    ).length;
    
    score += Math.min(keywordMatches * 0.05, 0.3);

    // Source-specific scoring
    if (content.source === 'reddit') {
      const metadata = content.metadata as any;
      
      // Upvote ratio and score
      if (metadata.upvote_ratio > 0.8) score += 0.1;
      if (metadata.score > 50) score += 0.1;
      if (metadata.num_comments > 20) score += 0.1;
      
      // Subreddit quality (some subreddits have higher quality content)
      const highQualitySubreddits = ['fitness', 'weightroom', 'bodyweightfitness'];
      if (highQualitySubreddits.includes(metadata.subreddit)) {
        score += 0.1;
      }
    } else if (content.source === 'wikipedia') {
      score += 0.2; // Wikipedia generally has higher quality
    }

    // Title relevance
    if (content.title) {
      const titleLower = content.title.toLowerCase();
      const titleKeywordMatches = fitnessKeywords.filter(keyword => 
        titleLower.includes(keyword)
      ).length;
      score += Math.min(titleKeywordMatches * 0.03, 0.15);
    }

    return Math.min(score, 1.0);
  }

  private extractTags(content: string, flair?: string): string[] {
    const tags: string[] = [];

    // Exercise type tags
    const exerciseTypes = [
      'strength', 'cardio', 'flexibility', 'bodyweight', 'weightlifting',
      'powerlifting', 'olympic', 'calisthenics', 'yoga', 'pilates',
      'running', 'swimming', 'cycling', 'crossfit'
    ];

    // Body part tags
    const bodyParts = [
      'chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps',
      'legs', 'quadriceps', 'hamstrings', 'glutes', 'calves',
      'abs', 'core', 'full-body'
    ];

    // Nutrition tags
    const nutritionTerms = [
      'protein', 'carbs', 'fats', 'calories', 'diet', 'supplements',
      'meal-prep', 'nutrition', 'cutting', 'bulking'
    ];

    const contentLower = content.toLowerCase();

    [exerciseTypes, bodyParts, nutritionTerms].flat().forEach(term => {
      if (contentLower.includes(term)) {
        tags.push(term);
      }
    });

    // Add flair as tag if present
    if (flair) {
      tags.push(flair.toLowerCase().replace(/\s+/g, '-'));
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  private classifyContent(content: string, flair?: string, categories?: string[]): ProcessedContent['content_type'] {
    const contentLower = content.toLowerCase();
    const titleAndFlair = `${flair || ''} ${content.substring(0, 200)}`.toLowerCase();

    // Check for exercise content
    if (contentLower.includes('exercise') || contentLower.includes('movement') ||
        titleAndFlair.includes('exercise')) {
      return 'exercise';
    }

    // Check for routine content
    if (contentLower.includes('routine') || contentLower.includes('program') ||
        contentLower.includes('workout plan') || titleAndFlair.includes('routine')) {
      return 'routine';
    }

    // Check for nutrition content
    if (contentLower.includes('nutrition') || contentLower.includes('diet') ||
        contentLower.includes('protein') || contentLower.includes('calories') ||
        titleAndFlair.includes('nutrition')) {
      return 'nutrition';
    }

    // Check for science content
    if (contentLower.includes('study') || contentLower.includes('research') ||
        contentLower.includes('physiology') || contentLower.includes('science') ||
        categories?.some(cat => cat.includes('physiology') || cat.includes('science'))) {
      return 'science';
    }

    // Check for guide content
    if (contentLower.includes('guide') || contentLower.includes('how to') ||
        contentLower.includes('tutorial') || titleAndFlair.includes('guide')) {
      return 'guide';
    }

    // Default to discussion
    return 'discussion';
  }

  /**
   * Save processed content to file
   */
  async saveContent(content: ProcessedContent[], outputPath: string): Promise<void> {
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const format = this.config.output.format;
    
    try {
      if (format === 'json') {
        writeFileSync(outputPath, JSON.stringify(content, null, 2));
      } else if (format === 'jsonl') {
        const jsonLines = content.map(item => JSON.stringify(item)).join('\n');
        writeFileSync(outputPath, jsonLines);
      } else if (format === 'csv') {
        // Simple CSV export (basic fields only)
        const csvHeader = 'id,source,title,content_type,quality_score,created_at,url\n';
        const csvRows = content.map(item => 
          `${item.id},"${item.title.replace(/"/g, '""')}",${item.content_type},${item.quality_score},${item.created_at},"${item.url}"`
        ).join('\n');
        writeFileSync(outputPath, csvHeader + csvRows);
      }

      this.logger.info(`Saved ${content.length} items to ${outputPath}`, {
        format,
        outputPath
      });

    } catch (error) {
      this.logger.error(`Failed to save content to ${outputPath}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get ingestion statistics
   */
  getStats(content: ProcessedContent[]): Record<string, any> {
    const stats = {
      total_items: content.length,
      sources: {} as Record<string, number>,
      content_types: {} as Record<string, number>,
      quality_distribution: {
        high: 0, // >= 0.8
        medium: 0, // 0.6-0.8
        low: 0 // < 0.6
      },
      avg_quality_score: 0,
      tags: {} as Record<string, number>
    };

    content.forEach(item => {
      // Source distribution
      stats.sources[item.source] = (stats.sources[item.source] || 0) + 1;
      
      // Content type distribution
      stats.content_types[item.content_type] = (stats.content_types[item.content_type] || 0) + 1;
      
      // Quality distribution
      if (item.quality_score >= 0.8) {
        stats.quality_distribution.high++;
      } else if (item.quality_score >= 0.6) {
        stats.quality_distribution.medium++;
      } else {
        stats.quality_distribution.low++;
      }
      
      // Tag frequency
      item.tags.forEach(tag => {
        stats.tags[tag] = (stats.tags[tag] || 0) + 1;
      });
    });

    stats.avg_quality_score = content.reduce((sum, item) => sum + item.quality_score, 0) / content.length;

    return stats;
  }
}

// CLI Interface
async function main() {
  const program = new Command();
  
  program
    .name('fitness-ingestor')
    .description('Fitness Knowledge Ingestor for LLM Context')
    .version('1.0.0');

  program
    .option('-s, --source <source>', 'Content source (reddit, wikipedia, all)', 'all')
    .option('-l, --limit <number>', 'Maximum number of items to ingest', '100')
    .option('-c, --config <path>', 'Config file path', '../config/fitness-sources.json')
    .option('-o, --output <path>', 'Output file path', '../data/fitness-knowledge.jsonl')
    .option('--stats', 'Show ingestion statistics')
    .parse();

  const options = program.opts();
  const limit = parseInt(options.limit);
  
  console.log('🚀 Starting Fitness Knowledge Ingestion...');
  console.log(`Source: ${options.source}, Limit: ${limit}`);

  try {
    const ingestor = new FitnessIngestor(options.config);
    const allContent: ProcessedContent[] = [];

    if (options.source === 'reddit' || options.source === 'all') {
      console.log('📱 Ingesting from Reddit...');
      const redditContent = await ingestor.ingestFromReddit(Math.floor(limit * 0.7));
      allContent.push(...redditContent);
    }

    if (options.source === 'wikipedia' || options.source === 'all') {
      console.log('📚 Ingesting from Wikipedia...');
      const wikiContent = await ingestor.ingestFromWikipedia(Math.floor(limit * 0.3));
      allContent.push(...wikiContent);
    }

    // Sort by quality score (highest first)
    allContent.sort((a, b) => b.quality_score - a.quality_score);

    // Limit final results
    const finalContent = allContent.slice(0, limit);

    await ingestor.saveContent(finalContent, options.output);

    if (options.stats) {
      const stats = ingestor.getStats(finalContent);
      console.log('\n📊 Ingestion Statistics:');
      console.log(JSON.stringify(stats, null, 2));
    }

    console.log(`\n✅ Ingestion complete! Processed ${finalContent.length} items.`);
    console.log(`💾 Output saved to: ${options.output}`);

  } catch (error) {
    console.error('❌ Ingestion failed:', error.message);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { FitnessIngestor, ProcessedContent, IngestorConfig };