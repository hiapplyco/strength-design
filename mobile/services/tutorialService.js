/**
 * Tutorial Service
 * Manages tutorial content, progress tracking, and Firebase Storage integration
 * Supports pose analysis tutorials with video content, text instructions, and progress tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db, storage } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { 
  ref, 
  getDownloadURL, 
  uploadBytes, 
  listAll, 
  getMetadata 
} from 'firebase/storage';

// Storage keys
const TUTORIAL_PROGRESS_KEY = '@tutorial_progress';
const TUTORIAL_CONTENT_CACHE_KEY = '@tutorial_content_cache';
const TUTORIAL_SETTINGS_KEY = '@tutorial_settings';
const USER_PREFERENCES_KEY = '@tutorial_user_preferences';

// Collection names
const TUTORIAL_PROGRESS = 'tutorialProgress';
const TUTORIAL_CONTENT = 'tutorialContent';
const TUTORIAL_ANALYTICS = 'tutorialAnalytics';
const USER_TUTORIAL_SETTINGS = 'userTutorialSettings';

// Storage paths
const TUTORIAL_VIDEOS_PATH = 'tutorials/videos';
const TUTORIAL_IMAGES_PATH = 'tutorials/images';
const TUTORIAL_DOCUMENTS_PATH = 'tutorials/documents';

/**
 * Tutorial Service Class
 * Comprehensive tutorial management with content delivery optimization
 */
class TutorialService {
  constructor() {
    this.contentCache = new Map(); // Content ID -> cached content
    this.progressCache = new Map(); // User ID -> progress data
    this.urlCache = new Map(); // Storage path -> download URL
    this.settingsCache = {};
    this.userPreferences = {};
    this.isInitialized = false;
    this.activeListeners = new Set();
    
    // Default settings
    this.defaultSettings = {
      autoplay: false,
      videoQuality: 'medium', // 'low', 'medium', 'high'
      downloadOnWifi: true,
      offlineMode: false,
      skipSeenContent: false,
      trackAnalytics: true,
      contentLanguage: 'en',
      subtitlesEnabled: true,
      playbackSpeed: 1.0
    };
    
    // Tutorial categories for pose analysis
    this.tutorialCategories = {
      'exercise-techniques': {
        name: 'Exercise Techniques',
        description: 'Proper form for squat, deadlift, push-up exercises',
        exercises: ['squat', 'deadlift', 'push_up'],
        priority: 1
      },
      'recording-best-practices': {
        name: 'Video Recording Tips',
        description: 'Lighting, angles, and framing for optimal pose analysis',
        priority: 2
      },
      'common-mistakes': {
        name: 'Common Mistakes',
        description: 'Identify and correct frequent form errors',
        priority: 3
      },
      'progressive-movements': {
        name: 'Progressive Movements',
        description: 'Beginner to advanced movement patterns',
        priority: 4
      },
      'app-walkthrough': {
        name: 'App Features',
        description: 'Complete guide to using the pose analysis features',
        priority: 5
      }
    };
  }

  /**
   * Initialize the tutorial service
   */
  async initialize() {
    try {
      console.log('📚 Initializing Tutorial Service...');
      
      // Load cached data
      await this.loadFromCache();
      
      // Load user settings and preferences
      await this.loadUserSettings();
      await this.loadUserPreferences();
      
      // Initialize content manifest
      await this.initializeContentManifest();
      
      this.isInitialized = true;
      console.log('✅ Tutorial Service initialized');
      
      return {
        success: true,
        message: 'Tutorial service initialized successfully',
        categoriesAvailable: Object.keys(this.tutorialCategories).length
      };
    } catch (error) {
      console.error('❌ Error initializing tutorial service:', error);
      return {
        success: false,
        message: `Initialization failed: ${error.message}`
      };
    }
  }

  /**
   * Get all available tutorial categories
   */
  async getTutorialCategories() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const user = auth.currentUser;
      if (!user) {
        // Return public categories
        return Object.entries(this.tutorialCategories).map(([id, category]) => ({
          id,
          ...category,
          progress: null,
          isLocked: false
        }));
      }

      // Get user progress for each category
      const categoriesWithProgress = await Promise.all(
        Object.entries(this.tutorialCategories).map(async ([id, category]) => {
          const progress = await this.getCategoryProgress(id);
          const contentList = await this.getCategoryContent(id);
          
          return {
            id,
            ...category,
            progress,
            contentCount: contentList.length,
            completedCount: contentList.filter(content => 
              progress.completedContent.includes(content.id)
            ).length,
            isLocked: this.isCategoryLocked(id, progress)
          };
        })
      );

      // Sort by priority and return
      return categoriesWithProgress.sort((a, b) => a.priority - b.priority);
    } catch (error) {
      console.error('❌ Error getting tutorial categories:', error);
      return [];
    }
  }

  /**
   * Get tutorial content for a specific category
   */
  async getCategoryContent(categoryId, options = {}) {
    try {
      const {
        includeProgress = true,
        onlyIncomplete = false,
        sortBy = 'order' // 'order', 'difficulty', 'duration'
      } = options;

      // Check cache first
      const cacheKey = `category_${categoryId}`;
      if (this.contentCache.has(cacheKey)) {
        const cached = this.contentCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 600000) { // 10 minutes
          return this.filterAndSortContent(cached.content, options);
        }
      }

      // Fetch from Firestore
      const q = query(
        collection(db, TUTORIAL_CONTENT),
        where('category', '==', categoryId),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      );

      const snapshot = await getDocs(q);
      const content = [];

      for (const doc of snapshot.docs) {
        const data = { id: doc.id, ...doc.data() };
        
        // Add progress data if requested and user is authenticated
        if (includeProgress && auth.currentUser) {
          data.progress = await this.getContentProgress(data.id);
        }
        
        // Process media URLs
        data.mediaUrls = await this.processMediaUrls(data.mediaFiles || []);
        
        content.push(data);
      }

      // Cache the results
      this.contentCache.set(cacheKey, {
        content,
        timestamp: Date.now()
      });

      return this.filterAndSortContent(content, options);
    } catch (error) {
      console.error('❌ Error getting category content:', error);
      return [];
    }
  }

  /**
   * Get specific tutorial content by ID
   */
  async getTutorialContent(contentId) {
    try {
      // Check cache first
      if (this.contentCache.has(contentId)) {
        const cached = this.contentCache.get(contentId);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes
          return cached.content;
        }
      }

      const docRef = doc(db, TUTORIAL_CONTENT, contentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error(`Tutorial content not found: ${contentId}`);
      }

      const content = { id: docSnap.id, ...docSnap.data() };
      
      // Process media URLs
      content.mediaUrls = await this.processMediaUrls(content.mediaFiles || []);
      
      // Add user progress if authenticated
      if (auth.currentUser) {
        content.progress = await this.getContentProgress(contentId);
      }

      // Cache the result
      this.contentCache.set(contentId, {
        content,
        timestamp: Date.now()
      });

      // Track view analytics
      if (auth.currentUser && this.settingsCache.trackAnalytics) {
        this.trackContentView(contentId);
      }

      return content;
    } catch (error) {
      console.error('❌ Error getting tutorial content:', error);
      throw error;
    }
  }

  /**
   * Start tutorial progress tracking
   */
  async startTutorial(contentId) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const progressData = {
        userId: user.uid,
        contentId,
        status: 'started',
        startedAt: serverTimestamp(),
        lastAccessedAt: serverTimestamp(),
        progressPercentage: 0,
        timeSpent: 0,
        currentSection: 0,
        bookmarks: [],
        notes: '',
        completed: false
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, TUTORIAL_PROGRESS), progressData);
      progressData.id = docRef.id;

      // Update cache
      this.updateProgressCache(user.uid, contentId, progressData);

      // Track analytics
      if (this.settingsCache.trackAnalytics) {
        await this.trackTutorialEvent('tutorial_started', {
          contentId,
          userId: user.uid,
          timestamp: new Date()
        });
      }

      console.log('▶️ Tutorial started:', contentId);
      return progressData;
    } catch (error) {
      console.error('❌ Error starting tutorial:', error);
      throw error;
    }
  }

  /**
   * Update tutorial progress
   */
  async updateTutorialProgress(contentId, updates) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Get existing progress
      const existingProgress = await this.getContentProgress(contentId);
      if (!existingProgress) {
        throw new Error('Tutorial not started');
      }

      const updatedProgress = {
        ...existingProgress,
        ...updates,
        lastAccessedAt: serverTimestamp()
      };

      // Auto-complete if progress reaches 100%
      if (updates.progressPercentage >= 100 && !updatedProgress.completed) {
        updatedProgress.completed = true;
        updatedProgress.completedAt = serverTimestamp();
        updatedProgress.status = 'completed';
      }

      // Update in Firestore
      const progressRef = doc(db, TUTORIAL_PROGRESS, existingProgress.id);
      await updateDoc(progressRef, updatedProgress);

      // Update cache
      this.updateProgressCache(user.uid, contentId, updatedProgress);

      // Track analytics for significant milestones
      if (this.settingsCache.trackAnalytics) {
        if (updatedProgress.completed && !existingProgress.completed) {
          await this.trackTutorialEvent('tutorial_completed', {
            contentId,
            userId: user.uid,
            timeSpent: updatedProgress.timeSpent,
            timestamp: new Date()
          });
        } else if (updates.progressPercentage && 
                   Math.floor(updates.progressPercentage / 25) > Math.floor(existingProgress.progressPercentage / 25)) {
          // Track quarter progress milestones
          await this.trackTutorialEvent('progress_milestone', {
            contentId,
            userId: user.uid,
            milestone: Math.floor(updates.progressPercentage / 25) * 25,
            timestamp: new Date()
          });
        }
      }

      console.log('📈 Tutorial progress updated:', contentId, updates);
      return updatedProgress;
    } catch (error) {
      console.error('❌ Error updating tutorial progress:', error);
      throw error;
    }
  }

  /**
   * Mark tutorial as completed
   */
  async completeTutorial(contentId, completionData = {}) {
    try {
      const updates = {
        progressPercentage: 100,
        completed: true,
        status: 'completed',
        completedAt: serverTimestamp(),
        ...completionData
      };

      const progress = await this.updateTutorialProgress(contentId, updates);

      // Check for category completion achievements
      const content = await this.getTutorialContent(contentId);
      if (content.category) {
        await this.checkCategoryCompletion(content.category);
      }

      return progress;
    } catch (error) {
      console.error('❌ Error completing tutorial:', error);
      throw error;
    }
  }

  /**
   * Get user's tutorial progress summary
   */
  async getUserProgress(options = {}) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const {
        includeDetails = false,
        categoryFilter = null,
        timeRange = 'all' // '7d', '30d', '90d', 'all'
      } = options;

      // Build query
      let q = query(
        collection(db, TUTORIAL_PROGRESS),
        where('userId', '==', user.uid)
      );

      // Add time filter if specified
      if (timeRange !== 'all') {
        const startDate = this.calculateStartDate(timeRange);
        q = query(q, where('lastAccessedAt', '>=', startDate));
      }

      const snapshot = await getDocs(q);
      const progressData = [];

      for (const doc of snapshot.docs) {
        const data = { id: doc.id, ...doc.data() };
        
        if (includeDetails) {
          // Add content details
          try {
            const content = await this.getTutorialContent(data.contentId);
            data.contentDetails = {
              title: content.title,
              category: content.category,
              difficulty: content.difficulty,
              estimatedDuration: content.estimatedDuration
            };
          } catch (contentError) {
            console.warn('Could not load content details for:', data.contentId);
          }
        }

        // Apply category filter
        if (categoryFilter && data.contentDetails?.category !== categoryFilter) {
          continue;
        }

        progressData.push(data);
      }

      // Calculate summary statistics
      const summary = this.calculateProgressSummary(progressData);

      return {
        summary,
        details: progressData.sort((a, b) => 
          new Date(b.lastAccessedAt?.toDate?.() || b.lastAccessedAt) - 
          new Date(a.lastAccessedAt?.toDate?.() || a.lastAccessedAt)
        )
      };
    } catch (error) {
      console.error('❌ Error getting user progress:', error);
      return { summary: null, details: [] };
    }
  }

  /**
   * Get recommended tutorials based on user progress and preferences
   */
  async getRecommendedTutorials(options = {}) {
    try {
      const {
        limit = 5,
        excludeCompleted = true,
        includeProgressive = true
      } = options;

      const user = auth.currentUser;
      let userProgress = null;
      
      if (user) {
        userProgress = await this.getUserProgress({ includeDetails: true });
      }

      const allCategories = await this.getTutorialCategories();
      const recommendations = [];

      for (const category of allCategories) {
        // Skip locked categories
        if (category.isLocked) continue;

        const categoryContent = await this.getCategoryContent(category.id, {
          includeProgress: !!user,
          onlyIncomplete: excludeCompleted
        });

        for (const content of categoryContent) {
          // Skip completed content if requested
          if (excludeCompleted && content.progress?.completed) {
            continue;
          }

          // Skip content that's too advanced for user
          if (includeProgressive && !this.isContentAppropriate(content, userProgress)) {
            continue;
          }

          const score = this.calculateRecommendationScore(content, userProgress, category);
          
          recommendations.push({
            ...content,
            recommendationScore: score,
            reason: this.getRecommendationReason(content, userProgress, category)
          });
        }
      }

      // Sort by recommendation score and return top results
      return recommendations
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting recommended tutorials:', error);
      return [];
    }
  }

  /**
   * Search tutorial content
   */
  async searchTutorials(query, options = {}) {
    try {
      const {
        categories = null,
        difficulty = null,
        maxDuration = null,
        includeTranscripts = false
      } = options;

      // For now, implement a simple client-side search
      // In production, consider using Algolia or Firebase's full-text search
      const allContent = [];
      const categories = this.tutorialCategories;

      for (const categoryId of Object.keys(categories)) {
        const categoryContent = await this.getCategoryContent(categoryId);
        allContent.push(...categoryContent);
      }

      const searchTerms = query.toLowerCase().split(' ');
      const results = [];

      for (const content of allContent) {
        let score = 0;
        const searchableText = [
          content.title,
          content.description,
          content.tags?.join(' '),
          includeTranscripts ? content.transcript : ''
        ].join(' ').toLowerCase();

        // Calculate search relevance score
        for (const term of searchTerms) {
          const occurrences = (searchableText.match(new RegExp(term, 'g')) || []).length;
          score += occurrences;
          
          // Boost score for title matches
          if (content.title.toLowerCase().includes(term)) {
            score += 5;
          }
        }

        if (score > 0) {
          // Apply filters
          if (categories && !categories.includes(content.category)) continue;
          if (difficulty && content.difficulty !== difficulty) continue;
          if (maxDuration && content.estimatedDuration > maxDuration) continue;

          results.push({
            ...content,
            searchScore: score
          });
        }
      }

      return results
        .sort((a, b) => b.searchScore - a.searchScore)
        .slice(0, 20); // Limit results
    } catch (error) {
      console.error('❌ Error searching tutorials:', error);
      return [];
    }
  }

  /**
   * Download tutorial content for offline use
   */
  async downloadForOffline(contentId, quality = 'medium') {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const content = await this.getTutorialContent(contentId);
      const downloadTasks = [];

      console.log('📥 Starting offline download for:', content.title);

      // Download video files
      if (content.mediaFiles) {
        for (const mediaFile of content.mediaFiles) {
          if (mediaFile.type === 'video') {
            const qualityVariant = mediaFile.qualities?.[quality] || mediaFile.url;
            downloadTasks.push(this.downloadMediaFile(qualityVariant, contentId, mediaFile.name));
          } else {
            // Download images and other media as-is
            downloadTasks.push(this.downloadMediaFile(mediaFile.url, contentId, mediaFile.name));
          }
        }
      }

      // Wait for all downloads to complete
      await Promise.all(downloadTasks);

      // Mark content as downloaded
      await this.markContentAsDownloaded(contentId, quality);

      console.log('✅ Content downloaded for offline use:', contentId);
      return {
        success: true,
        contentId,
        downloadedAt: new Date(),
        quality,
        filesDownloaded: downloadTasks.length
      };
    } catch (error) {
      console.error('❌ Error downloading content for offline:', error);
      throw error;
    }
  }

  /**
   * Update user tutorial settings
   */
  async updateUserSettings(settings) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const updatedSettings = {
        ...this.defaultSettings,
        ...this.settingsCache,
        ...settings,
        userId: user.uid,
        updatedAt: serverTimestamp()
      };

      // Save to Firestore
      const settingsRef = doc(db, USER_TUTORIAL_SETTINGS, user.uid);
      await updateDoc(settingsRef, updatedSettings);

      // Update cache
      this.settingsCache = updatedSettings;
      await this.saveSettingsCache();

      console.log('⚙️ Tutorial settings updated');
      return updatedSettings;
    } catch (error) {
      console.error('❌ Error updating tutorial settings:', error);
      throw error;
    }
  }

  /**
   * Get tutorial analytics for admin/content creators
   */
  async getTutorialAnalytics(contentId = null, timeRange = '30d') {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      let q = query(
        collection(db, TUTORIAL_ANALYTICS),
        where('timestamp', '>=', this.calculateStartDate(timeRange))
      );

      if (contentId) {
        q = query(q, where('contentId', '==', contentId));
      }

      const snapshot = await getDocs(q);
      const events = [];

      snapshot.forEach(doc => {
        events.push({ id: doc.id, ...doc.data() });
      });

      // Calculate analytics summary
      const analytics = this.calculateAnalyticsSummary(events);

      return analytics;
    } catch (error) {
      console.error('❌ Error getting tutorial analytics:', error);
      return null;
    }
  }

  /**
   * Private helper methods
   */

  /**
   * Process media URLs to get download URLs from Firebase Storage
   */
  async processMediaUrls(mediaFiles) {
    const processedUrls = {};

    for (const mediaFile of mediaFiles) {
      try {
        // Check URL cache first
        if (this.urlCache.has(mediaFile.path)) {
          const cached = this.urlCache.get(mediaFile.path);
          if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
            processedUrls[mediaFile.name] = cached.url;
            continue;
          }
        }

        // Get download URL from Firebase Storage
        const fileRef = ref(storage, mediaFile.path);
        const downloadURL = await getDownloadURL(fileRef);
        
        // Cache the URL
        this.urlCache.set(mediaFile.path, {
          url: downloadURL,
          timestamp: Date.now()
        });
        
        processedUrls[mediaFile.name] = downloadURL;
      } catch (error) {
        console.warn('Could not get URL for media file:', mediaFile.path, error);
        processedUrls[mediaFile.name] = null;
      }
    }

    return processedUrls;
  }

  /**
   * Filter and sort content based on options
   */
  filterAndSortContent(content, options) {
    let filtered = [...content];

    if (options.onlyIncomplete) {
      filtered = filtered.filter(item => !item.progress?.completed);
    }

    switch (options.sortBy) {
      case 'difficulty':
        filtered.sort((a, b) => {
          const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        });
        break;
      case 'duration':
        filtered.sort((a, b) => (a.estimatedDuration || 0) - (b.estimatedDuration || 0));
        break;
      default: // 'order'
        filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    return filtered;
  }

  /**
   * Get category progress for a user
   */
  async getCategoryProgress(categoryId) {
    try {
      const user = auth.currentUser;
      if (!user) {
        return {
          completedContent: [],
          totalProgress: 0,
          lastAccessed: null,
          timeSpent: 0
        };
      }

      const q = query(
        collection(db, TUTORIAL_PROGRESS),
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      const completedContent = [];
      let totalTimeSpent = 0;
      let lastAccessed = null;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        try {
          const content = await this.getTutorialContent(data.contentId);
          if (content.category === categoryId) {
            if (data.completed) {
              completedContent.push(data.contentId);
            }
            totalTimeSpent += data.timeSpent || 0;
            
            const accessDate = data.lastAccessedAt?.toDate?.() || new Date(data.lastAccessedAt);
            if (!lastAccessed || accessDate > lastAccessed) {
              lastAccessed = accessDate;
            }
          }
        } catch (error) {
          // Content might not exist anymore, skip
          continue;
        }
      }

      const categoryContent = await this.getCategoryContent(categoryId, { includeProgress: false });
      const totalProgress = categoryContent.length > 0 
        ? (completedContent.length / categoryContent.length) * 100 
        : 0;

      return {
        completedContent,
        totalProgress,
        lastAccessed,
        timeSpent: totalTimeSpent
      };
    } catch (error) {
      console.error('❌ Error getting category progress:', error);
      return {
        completedContent: [],
        totalProgress: 0,
        lastAccessed: null,
        timeSpent: 0
      };
    }
  }

  /**
   * Get progress for specific content
   */
  async getContentProgress(contentId) {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      // Check cache first
      const cacheKey = `${user.uid}_${contentId}`;
      if (this.progressCache.has(cacheKey)) {
        const cached = this.progressCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
          return cached.progress;
        }
      }

      const q = query(
        collection(db, TUTORIAL_PROGRESS),
        where('userId', '==', user.uid),
        where('contentId', '==', contentId),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const progress = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      
      // Cache the result
      this.progressCache.set(cacheKey, {
        progress,
        timestamp: Date.now()
      });

      return progress;
    } catch (error) {
      console.error('❌ Error getting content progress:', error);
      return null;
    }
  }

  /**
   * Check if a category should be locked based on prerequisites
   */
  isCategoryLocked(categoryId, progress) {
    // Basic implementation - more sophisticated logic can be added
    const category = this.tutorialCategories[categoryId];
    
    // Always unlock exercise techniques and app walkthrough
    if (['exercise-techniques', 'app-walkthrough'].includes(categoryId)) {
      return false;
    }

    // Recording best practices requires some exercise technique completion
    if (categoryId === 'recording-best-practices') {
      const exerciseProgress = this.tutorialCategories['exercise-techniques'];
      return progress.totalProgress < 25; // At least 25% of exercise techniques
    }

    // Common mistakes requires recording knowledge
    if (categoryId === 'common-mistakes') {
      // Could add logic to check recording-best-practices completion
      return false; // For now, always accessible
    }

    return false; // Default to unlocked
  }

  /**
   * Update progress cache
   */
  updateProgressCache(userId, contentId, progressData) {
    const cacheKey = `${userId}_${contentId}`;
    this.progressCache.set(cacheKey, {
      progress: progressData,
      timestamp: Date.now()
    });
  }

  /**
   * Track tutorial analytics events
   */
  async trackTutorialEvent(eventType, eventData) {
    try {
      if (!this.settingsCache.trackAnalytics) return;

      const analyticsData = {
        eventType,
        ...eventData,
        timestamp: serverTimestamp(),
        sessionId: this.getSessionId()
      };

      await addDoc(collection(db, TUTORIAL_ANALYTICS), analyticsData);
    } catch (error) {
      console.warn('⚠️ Failed to track tutorial event:', error);
    }
  }

  /**
   * Track content view
   */
  async trackContentView(contentId) {
    await this.trackTutorialEvent('content_viewed', {
      contentId,
      userId: auth.currentUser?.uid,
      userAgent: navigator.userAgent,
      timestamp: new Date()
    });
  }

  /**
   * Initialize content manifest
   */
  async initializeContentManifest() {
    // This would typically load a manifest of available content
    // For now, we'll rely on Firestore queries
    console.log('📋 Content manifest initialized');
  }

  /**
   * Check for category completion achievements
   */
  async checkCategoryCompletion(categoryId) {
    try {
      const progress = await this.getCategoryProgress(categoryId);
      
      if (progress.totalProgress >= 100) {
        await this.trackTutorialEvent('category_completed', {
          categoryId,
          userId: auth.currentUser.uid,
          timeSpent: progress.timeSpent,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.warn('⚠️ Error checking category completion:', error);
    }
  }

  /**
   * Calculate recommendation score for content
   */
  calculateRecommendationScore(content, userProgress, category) {
    let score = category.priority * 10; // Base score from category priority

    // Boost score for user's skill level
    if (content.difficulty === this.getUserSkillLevel(userProgress)) {
      score += 20;
    }

    // Boost score for shorter content (easier to complete)
    if (content.estimatedDuration <= 300) { // 5 minutes or less
      score += 10;
    }

    // Boost score for popular content
    if (content.viewCount > 100) {
      score += 5;
    }

    return score;
  }

  /**
   * Get recommendation reason
   */
  getRecommendationReason(content, userProgress, category) {
    if (category.priority === 1) {
      return "Essential technique tutorial for pose analysis";
    }
    
    if (content.difficulty === 'beginner' && (!userProgress || userProgress.summary?.totalCompleted < 3)) {
      return "Great for getting started";
    }
    
    if (content.estimatedDuration <= 300) {
      return "Quick tutorial, perfect for a short break";
    }
    
    return "Recommended based on your progress";
  }

  /**
   * Check if content is appropriate for user's level
   */
  isContentAppropriate(content, userProgress) {
    const userLevel = this.getUserSkillLevel(userProgress);
    
    if (userLevel === 'beginner' && content.difficulty === 'advanced') {
      return false;
    }
    
    return true;
  }

  /**
   * Get user's skill level based on progress
   */
  getUserSkillLevel(userProgress) {
    if (!userProgress || !userProgress.summary) {
      return 'beginner';
    }
    
    const { totalCompleted, averageScore } = userProgress.summary;
    
    if (totalCompleted >= 15 && averageScore >= 80) {
      return 'advanced';
    } else if (totalCompleted >= 5 && averageScore >= 60) {
      return 'intermediate';
    }
    
    return 'beginner';
  }

  /**
   * Calculate progress summary
   */
  calculateProgressSummary(progressData) {
    const completed = progressData.filter(p => p.completed).length;
    const inProgress = progressData.filter(p => !p.completed && p.progressPercentage > 0).length;
    const totalTimeSpent = progressData.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    
    const scores = progressData
      .filter(p => p.completionScore)
      .map(p => p.completionScore);
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;

    return {
      totalStarted: progressData.length,
      totalCompleted: completed,
      totalInProgress: inProgress,
      completionRate: progressData.length > 0 ? (completed / progressData.length) * 100 : 0,
      totalTimeSpent,
      averageScore,
      lastActivity: progressData.length > 0 
        ? Math.max(...progressData.map(p => 
            new Date(p.lastAccessedAt?.toDate?.() || p.lastAccessedAt).getTime()
          ))
        : null
    };
  }

  /**
   * Calculate analytics summary
   */
  calculateAnalyticsSummary(events) {
    const eventTypes = {};
    const contentViews = {};
    const userEngagement = {};

    events.forEach(event => {
      // Count event types
      eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1;
      
      // Track content views
      if (event.eventType === 'content_viewed') {
        contentViews[event.contentId] = (contentViews[event.contentId] || 0) + 1;
      }
      
      // Track user engagement
      if (event.userId) {
        if (!userEngagement[event.userId]) {
          userEngagement[event.userId] = { events: 0, lastSeen: null };
        }
        userEngagement[event.userId].events++;
        
        const eventTime = event.timestamp?.toDate?.() || new Date(event.timestamp);
        if (!userEngagement[event.userId].lastSeen || eventTime > userEngagement[event.userId].lastSeen) {
          userEngagement[event.userId].lastSeen = eventTime;
        }
      }
    });

    return {
      totalEvents: events.length,
      eventTypes,
      mostViewedContent: Object.entries(contentViews)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([contentId, views]) => ({ contentId, views })),
      activeUsers: Object.keys(userEngagement).length,
      avgEventsPerUser: Object.keys(userEngagement).length > 0 
        ? events.length / Object.keys(userEngagement).length 
        : 0
    };
  }

  /**
   * Utility methods
   */

  calculateStartDate(timeRange) {
    const now = new Date();
    const days = { '7d': 7, '30d': 30, '90d': 90 };
    if (days[timeRange]) {
      now.setDate(now.getDate() - days[timeRange]);
    }
    return now;
  }

  getSessionId() {
    // Simple session ID generation
    if (!this._sessionId) {
      this._sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this._sessionId;
  }

  /**
   * Cache management methods
   */

  async loadFromCache() {
    try {
      const [progressCache, contentCache] = await Promise.all([
        AsyncStorage.getItem(TUTORIAL_PROGRESS_KEY),
        AsyncStorage.getItem(TUTORIAL_CONTENT_CACHE_KEY)
      ]);

      if (progressCache) {
        const data = JSON.parse(progressCache);
        this.progressCache = new Map(data.entries || []);
      }

      if (contentCache) {
        const data = JSON.parse(contentCache);
        this.contentCache = new Map(data.entries || []);
        this.urlCache = new Map(data.urlEntries || []);
      }
    } catch (error) {
      console.warn('⚠️ Error loading tutorial cache:', error);
    }
  }

  async saveToCache() {
    try {
      const progressData = {
        entries: Array.from(this.progressCache.entries()),
        timestamp: Date.now()
      };

      const contentData = {
        entries: Array.from(this.contentCache.entries()),
        urlEntries: Array.from(this.urlCache.entries()),
        timestamp: Date.now()
      };

      await Promise.all([
        AsyncStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(progressData)),
        AsyncStorage.setItem(TUTORIAL_CONTENT_CACHE_KEY, JSON.stringify(contentData))
      ]);
    } catch (error) {
      console.warn('⚠️ Error saving tutorial cache:', error);
    }
  }

  async loadUserSettings() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Try cache first
      const cached = await AsyncStorage.getItem(TUTORIAL_SETTINGS_KEY);
      if (cached) {
        this.settingsCache = JSON.parse(cached);
      }

      // Load from Firestore
      const settingsRef = doc(db, USER_TUTORIAL_SETTINGS, user.uid);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        this.settingsCache = { ...this.defaultSettings, ...settingsDoc.data() };
        await this.saveSettingsCache();
      } else {
        this.settingsCache = { ...this.defaultSettings, userId: user.uid };
        await updateDoc(settingsRef, this.settingsCache);
      }
    } catch (error) {
      console.warn('⚠️ Error loading tutorial settings:', error);
      this.settingsCache = this.defaultSettings;
    }
  }

  async saveSettingsCache() {
    try {
      await AsyncStorage.setItem(TUTORIAL_SETTINGS_KEY, JSON.stringify(this.settingsCache));
    } catch (error) {
      console.warn('⚠️ Error saving settings cache:', error);
    }
  }

  async loadUserPreferences() {
    try {
      const cached = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
      if (cached) {
        this.userPreferences = JSON.parse(cached);
      }
    } catch (error) {
      console.warn('⚠️ Error loading user preferences:', error);
    }
  }

  async saveUserPreferences() {
    try {
      await AsyncStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(this.userPreferences));
    } catch (error) {
      console.warn('⚠️ Error saving user preferences:', error);
    }
  }

  /**
   * Enhanced Progress Tracking and User Engagement Metrics
   */

  /**
   * Track detailed user engagement metrics
   */
  async trackEngagementMetrics(contentId, engagementData) {
    try {
      const user = auth.currentUser;
      if (!user || !this.settingsCache.trackAnalytics) return;

      const metrics = {
        userId: user.uid,
        contentId,
        sessionId: this.getSessionId(),
        
        // Engagement metrics
        timeSpent: engagementData.timeSpent || 0,
        interactionCount: engagementData.interactionCount || 0,
        scrollDepth: engagementData.scrollDepth || 0,
        pauseCount: engagementData.pauseCount || 0,
        rewindCount: engagementData.rewindCount || 0,
        speedChanges: engagementData.speedChanges || 0,
        
        // Learning indicators
        notesAdded: engagementData.notesAdded || 0,
        bookmarksAdded: engagementData.bookmarksAdded || 0,
        questionsAsked: engagementData.questionsAsked || 0,
        
        // Completion metrics
        completionPercentage: engagementData.completionPercentage || 0,
        exitPoint: engagementData.exitPoint || 0,
        returnVisits: engagementData.returnVisits || 0,
        
        timestamp: serverTimestamp()
      };

      // Calculate engagement score
      metrics.engagementScore = this.calculateEngagementScore(metrics);

      // Save to analytics
      await addDoc(collection(db, TUTORIAL_ANALYTICS), {
        ...metrics,
        eventType: 'engagement_metrics'
      });

      console.log('📊 Engagement metrics tracked for:', contentId);
      return metrics;
    } catch (error) {
      console.warn('⚠️ Failed to track engagement metrics:', error);
      return null;
    }
  }

  /**
   * Calculate user engagement score
   */
  calculateEngagementScore(metrics) {
    let score = 0;
    
    // Time-based scoring (0-30 points)
    const timeScore = Math.min(30, (metrics.timeSpent / 300) * 30); // 5 minutes = max time score
    score += timeScore;
    
    // Interaction scoring (0-25 points)
    const interactionScore = Math.min(25, metrics.interactionCount * 5);
    score += interactionScore;
    
    // Learning indicator scoring (0-25 points)
    const learningScore = (metrics.notesAdded * 5) + (metrics.bookmarksAdded * 3) + (metrics.questionsAsked * 7);
    score += Math.min(25, learningScore);
    
    // Completion scoring (0-20 points)
    const completionScore = (metrics.completionPercentage / 100) * 20;
    score += completionScore;
    
    return Math.round(score);
  }

  /**
   * Get comprehensive user analytics dashboard data
   */
  async getUserAnalyticsDashboard(options = {}) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const { timeRange = '30d' } = options;

      // Get engagement metrics
      const engagementData = await this.getEngagementAnalytics(user.uid, timeRange);
      
      // Get learning progress
      const progressData = await this.getUserProgress({
        includeDetails: true,
        timeRange
      });
      
      // Calculate trends
      const trends = await this.calculateProgressTrends(user.uid, timeRange);
      
      // Get personalized insights
      const insights = await this.generatePersonalizedInsights(
        engagementData,
        progressData,
        trends
      );

      const dashboard = {
        user: {
          id: user.uid,
          level: this.getUserSkillLevel(progressData),
          totalTimeSpent: progressData.summary?.totalTimeSpent || 0,
          totalCompleted: progressData.summary?.totalCompleted || 0
        },
        
        engagement: {
          averageScore: engagementData.averageScore || 0,
          totalSessions: engagementData.totalSessions || 0,
          averageSessionLength: engagementData.averageSessionLength || 0,
          mostEngagedContent: engagementData.topContent || []
        },
        
        progress: {
          completionRate: progressData.summary?.completionRate || 0,
          averageScore: progressData.summary?.averageScore || 0,
          currentStreak: await this.calculateCurrentStreak(user.uid),
          longestStreak: await this.calculateLongestStreak(user.uid)
        },
        
        trends,
        insights,
        
        lastUpdated: new Date()
      };

      return dashboard;
    } catch (error) {
      console.error('❌ Error getting user analytics dashboard:', error);
      return null;
    }
  }

  /**
   * Get engagement analytics for user
   */
  async getEngagementAnalytics(userId, timeRange = '30d') {
    try {
      const startDate = this.calculateStartDate(timeRange);
      
      const q = query(
        collection(db, TUTORIAL_ANALYTICS),
        where('userId', '==', userId),
        where('eventType', '==', 'engagement_metrics'),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const engagementData = [];
      
      snapshot.forEach(doc => {
        engagementData.push(doc.data());
      });

      // Calculate aggregated metrics
      const totalSessions = engagementData.length;
      const totalTime = engagementData.reduce((sum, data) => sum + (data.timeSpent || 0), 0);
      const totalEngagementScore = engagementData.reduce((sum, data) => sum + (data.engagementScore || 0), 0);
      
      // Find top content by engagement
      const contentEngagement = {};
      engagementData.forEach(data => {
        if (!contentEngagement[data.contentId]) {
          contentEngagement[data.contentId] = {
            contentId: data.contentId,
            totalEngagement: 0,
            sessions: 0
          };
        }
        contentEngagement[data.contentId].totalEngagement += data.engagementScore || 0;
        contentEngagement[data.contentId].sessions += 1;
      });

      const topContent = Object.values(contentEngagement)
        .sort((a, b) => b.totalEngagement - a.totalEngagement)
        .slice(0, 5);

      return {
        totalSessions,
        averageSessionLength: totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0,
        averageScore: totalSessions > 0 ? Math.round(totalEngagementScore / totalSessions) : 0,
        totalTime,
        topContent
      };
    } catch (error) {
      console.error('❌ Error getting engagement analytics:', error);
      return {
        totalSessions: 0,
        averageSessionLength: 0,
        averageScore: 0,
        totalTime: 0,
        topContent: []
      };
    }
  }

  /**
   * Calculate progress trends
   */
  async calculateProgressTrends(userId, timeRange) {
    try {
      const startDate = this.calculateStartDate(timeRange);
      
      const q = query(
        collection(db, TUTORIAL_PROGRESS),
        where('userId', '==', userId),
        where('lastAccessedAt', '>=', startDate),
        orderBy('lastAccessedAt', 'asc')
      );

      const snapshot = await getDocs(q);
      const progressPoints = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        progressPoints.push({
          date: data.lastAccessedAt.toDate(),
          progress: data.progressPercentage || 0,
          timeSpent: data.timeSpent || 0
        });
      });

      return {
        progressTrend: this.calculateTrendDirection(progressPoints, 'progress'),
        timeTrend: this.calculateTrendDirection(progressPoints, 'timeSpent'),
        consistencyScore: this.calculateConsistencyScore(progressPoints)
      };
    } catch (error) {
      console.error('❌ Error calculating progress trends:', error);
      return {
        progressTrend: 'stable',
        timeTrend: 'stable',
        consistencyScore: 0
      };
    }
  }

  /**
   * Generate personalized insights
   */
  async generatePersonalizedInsights(engagementData, progressData, trends) {
    const insights = [];

    // Engagement insights
    if (engagementData.averageScore > 75) {
      insights.push({
        type: 'positive',
        category: 'engagement',
        message: 'Excellent engagement! You\'re actively participating in tutorials.',
        action: 'Continue your current learning approach.'
      });
    } else if (engagementData.averageScore < 40) {
      insights.push({
        type: 'improvement',
        category: 'engagement',
        message: 'Your engagement could be improved with more interactive learning.',
        action: 'Try taking notes or bookmarking key moments during tutorials.'
      });
    }

    // Progress insights
    if (trends.progressTrend === 'improving') {
      insights.push({
        type: 'positive',
        category: 'progress',
        message: 'Great momentum! Your learning progress is accelerating.',
        action: 'Keep up the consistent practice.'
      });
    } else if (trends.progressTrend === 'declining') {
      insights.push({
        type: 'warning',
        category: 'progress',
        message: 'Your progress has slowed recently.',
        action: 'Consider reviewing fundamentals or adjusting your learning schedule.'
      });
    }

    return insights;
  }

  /**
   * Calculate current learning streak
   */
  async calculateCurrentStreak(userId) {
    try {
      const q = query(
        collection(db, TUTORIAL_PROGRESS),
        where('userId', '==', userId),
        orderBy('lastAccessedAt', 'desc'),
        limit(30)
      );

      const snapshot = await getDocs(q);
      const sessions = [];
      
      snapshot.forEach(doc => {
        sessions.push(doc.data().lastAccessedAt.toDate());
      });

      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < sessions.length; i++) {
        const sessionDate = sessions[i];
        const daysDiff = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
          streak++;
        } else if (daysDiff > streak) {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('❌ Error calculating current streak:', error);
      return 0;
    }
  }

  /**
   * Calculate longest learning streak
   */
  async calculateLongestStreak(userId) {
    try {
      const q = query(
        collection(db, TUTORIAL_PROGRESS),
        where('userId', '==', userId),
        orderBy('lastAccessedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const sessions = [];
      
      snapshot.forEach(doc => {
        sessions.push(doc.data().lastAccessedAt.toDate());
      });

      let longestStreak = 0;
      let currentStreak = 0;
      
      for (let i = 0; i < sessions.length - 1; i++) {
        const current = sessions[i];
        const next = sessions[i + 1];
        const daysDiff = Math.floor((current - next) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 0;
        }
      }

      return Math.max(longestStreak, currentStreak);
    } catch (error) {
      console.error('❌ Error calculating longest streak:', error);
      return 0;
    }
  }

  /**
   * Helper methods for analytics
   */
  calculateTrendDirection(dataPoints, metric) {
    if (dataPoints.length < 3) return 'stable';
    
    const recent = dataPoints.slice(-Math.ceil(dataPoints.length / 2));
    const older = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
    
    const recentAvg = recent.reduce((sum, point) => sum + (point[metric] || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, point) => sum + (point[metric] || 0), 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    const threshold = olderAvg * 0.1; // 10% change threshold
    
    if (difference > threshold) return 'improving';
    if (difference < -threshold) return 'declining';
    return 'stable';
  }

  calculateConsistencyScore(dataPoints) {
    if (dataPoints.length < 2) return 100;
    
    const intervals = [];
    for (let i = 1; i < dataPoints.length; i++) {
      const timeDiff = dataPoints[i].date - dataPoints[i - 1].date;
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      intervals.push(daysDiff);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    const consistencyScore = Math.max(0, 100 - (stdDev / avgInterval) * 100);
    return Math.round(consistencyScore);
  }

  /**
   * Cleanup methods
   */

  async clearCache() {
    try {
      await AsyncStorage.multiRemove([
        TUTORIAL_PROGRESS_KEY,
        TUTORIAL_CONTENT_CACHE_KEY,
        TUTORIAL_SETTINGS_KEY,
        USER_PREFERENCES_KEY
      ]);

      this.contentCache.clear();
      this.progressCache.clear();
      this.urlCache.clear();
      this.settingsCache = {};
      this.userPreferences = {};

      console.log('🗑️ Tutorial cache cleared');
    } catch (error) {
      console.error('❌ Error clearing tutorial cache:', error);
    }
  }

  destroy() {
    // Clean up listeners
    this.activeListeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.activeListeners.clear();

    // Clear caches
    this.contentCache.clear();
    this.progressCache.clear();
    this.urlCache.clear();
    this.settingsCache = {};
    this.userPreferences = {};
    this.isInitialized = false;

    console.log('🔄 Tutorial Service destroyed');
  }
}

// Create singleton instance
const tutorialService = new TutorialService();

export default tutorialService;