/**
 * Content Delivery Service
 * Optimized content delivery with caching, progressive loading, and network awareness
 * Handles video streaming, image optimization, and offline content management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import { auth, storage } from '../firebaseConfig';
import { 
  ref, 
  getDownloadURL, 
  getMetadata, 
  listAll 
} from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Storage and cache keys
const CONTENT_CACHE_KEY = '@content_delivery_cache';
const DOWNLOAD_QUEUE_KEY = '@download_queue';
const CACHE_METADATA_KEY = '@cache_metadata';
const NETWORK_SETTINGS_KEY = '@network_settings';
const PERFORMANCE_METRICS_KEY = '@performance_metrics';

// Cache directories
const CACHE_DIR = `${FileSystem.documentDirectory}tutorial_cache/`;
const VIDEO_CACHE_DIR = `${CACHE_DIR}videos/`;
const IMAGE_CACHE_DIR = `${CACHE_DIR}images/`;
const DOCUMENT_CACHE_DIR = `${CACHE_DIR}documents/`;

// Content delivery optimization settings
const CACHE_EXPIRY_HOURS = 24;
const MAX_CACHE_SIZE_MB = 500;
const MAX_CONCURRENT_DOWNLOADS = 3;
const PROGRESSIVE_CHUNK_SIZE = 1024 * 1024; // 1MB chunks
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Content Delivery Service Class
 * Handles optimized content delivery with intelligent caching and network awareness
 */
class ContentDeliveryService {
  constructor() {
    this.downloadQueue = [];
    this.activeDownloads = new Map(); // Download ID -> Promise
    this.cacheMetadata = new Map(); // File path -> metadata
    this.networkSettings = {};
    this.networkState = null;
    this.performanceMetrics = new Map(); // Content ID -> performance data
    this.adaptiveQuality = new Map(); // Content ID -> optimal quality
    this.isInitialized = false;
    
    // Default network settings
    this.defaultNetworkSettings = {
      enableCaching: true,
      wifiOnlyDownloads: true,
      maxConcurrentDownloads: MAX_CONCURRENT_DOWNLOADS,
      progressiveLoading: true,
      videoQualityAuto: true,
      preloadNextContent: true,
      maxCacheSize: MAX_CACHE_SIZE_MB,
      cacheExpiryHours: CACHE_EXPIRY_HOURS
    };
    
    // Quality settings for different network conditions
    this.qualitySettings = {
      'slow-2g': { video: 'low', image: 'small' },
      '2g': { video: 'low', image: 'medium' },
      '3g': { video: 'medium', image: 'medium' },
      '4g': { video: 'high', image: 'large' },
      '5g': { video: 'high', image: 'large' },
      'wifi': { video: 'high', image: 'large' },
      'unknown': { video: 'medium', image: 'medium' }
    };
  }

  /**
   * Initialize the content delivery service
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Content Delivery Service...');
      
      // Create cache directories
      await this.ensureCacheDirectories();
      
      // Load cached data
      await this.loadFromCache();
      
      // Load network settings
      await this.loadNetworkSettings();
      
      // Set up network monitoring
      await this.setupNetworkMonitoring();
      
      // Resume any interrupted downloads
      await this.resumeInterruptedDownloads();
      
      // Clean up expired cache
      await this.cleanupExpiredCache();
      
      this.isInitialized = true;
      console.log('✅ Content Delivery Service initialized');
      
      return {
        success: true,
        message: 'Content delivery service initialized successfully',
        cacheSize: await this.getCacheSize(),
        networkType: this.networkState?.type || 'unknown'
      };
    } catch (error) {
      console.error('❌ Error initializing content delivery service:', error);
      return {
        success: false,
        message: `Initialization failed: ${error.message}`
      };
    }
  }

  /**
   * Get optimized content URL with caching and quality selection
   */
  async getContentUrl(contentPath, options = {}) {
    try {
      const {
        quality = 'auto',
        allowCache = true,
        forceRefresh = false,
        progressCallback = null
      } = options;

      if (!this.isInitialized) {
        await this.initialize();
      }

      // Determine optimal quality based on network conditions
      const optimalQuality = quality === 'auto' 
        ? this.getOptimalQuality(contentPath)
        : quality;

      // Generate cache key
      const cacheKey = this.generateCacheKey(contentPath, optimalQuality);
      const localPath = await this.getLocalCachePath(contentPath, optimalQuality);

      // Check if content is already cached and valid
      if (allowCache && !forceRefresh && await this.isCacheValid(localPath)) {
        console.log('📁 Serving from cache:', contentPath);
        return {
          url: localPath,
          source: 'cache',
          quality: optimalQuality,
          cached: true
        };
      }

      // Check network conditions
      if (!this.shouldDownloadNow(contentPath)) {
        // Try to serve lower quality cached version
        const cachedVersion = await this.findCachedVersion(contentPath);
        if (cachedVersion) {
          console.log('📱 Serving cached lower quality due to network:', contentPath);
          return cachedVersion;
        }
      }

      // Get Firebase Storage reference
      const fileRef = ref(storage, contentPath);
      
      // Get download URL
      const downloadUrl = await getDownloadURL(fileRef);
      const metadata = await getMetadata(fileRef);

      // For small files, download immediately
      if (metadata.size < 1024 * 1024) { // < 1MB
        const localUrl = await this.downloadAndCache(
          downloadUrl, 
          localPath, 
          metadata,
          progressCallback
        );
        
        return {
          url: localUrl,
          source: 'downloaded',
          quality: optimalQuality,
          cached: true,
          size: metadata.size
        };
      }

      // For larger files, decide based on settings
      if (this.networkSettings.progressiveLoading) {
        // Queue for background download
        this.queueForDownload(downloadUrl, localPath, metadata, optimalQuality);
        
        // Return streaming URL for immediate use
        return {
          url: downloadUrl,
          source: 'stream',
          quality: optimalQuality,
          cached: false,
          size: metadata.size,
          downloadQueued: true
        };
      }

      // Direct download for immediate caching
      const localUrl = await this.downloadAndCache(
        downloadUrl, 
        localPath, 
        metadata,
        progressCallback
      );
      
      return {
        url: localUrl,
        source: 'downloaded',
        quality: optimalQuality,
        cached: true,
        size: metadata.size
      };
    } catch (error) {
      console.error('❌ Error getting content URL:', error);
      
      // Try to fallback to cached version
      const cachedVersion = await this.findCachedVersion(contentPath);
      if (cachedVersion) {
        console.log('🔄 Fallback to cached version:', contentPath);
        return cachedVersion;
      }
      
      throw error;
    }
  }

  /**
   * Download content with progress tracking and resumability
   */
  async downloadContent(contentPath, options = {}) {
    try {
      const {
        quality = 'auto',
        priority = 'normal', // 'high', 'normal', 'low'
        progressCallback = null,
        overwrite = false
      } = options;

      const downloadId = this.generateDownloadId(contentPath, quality);
      
      // Check if already downloading
      if (this.activeDownloads.has(downloadId)) {
        console.log('⏳ Download already in progress:', contentPath);
        return this.activeDownloads.get(downloadId);
      }

      // Create download promise
      const downloadPromise = this.executeDownload(
        contentPath, 
        quality, 
        progressCallback,
        overwrite
      );
      
      // Track active download
      this.activeDownloads.set(downloadId, downloadPromise);
      
      // Clean up when done
      downloadPromise.finally(() => {
        this.activeDownloads.delete(downloadId);
      });

      return downloadPromise;
    } catch (error) {
      console.error('❌ Error downloading content:', error);
      throw error;
    }
  }

  /**
   * Execute content download with retry logic
   */
  async executeDownload(contentPath, quality, progressCallback, overwrite = false) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`📥 Download attempt ${attempt}/${RETRY_ATTEMPTS}:`, contentPath);
        
        const localPath = await this.getLocalCachePath(contentPath, quality);
        
        // Skip if already exists and not overwriting
        if (!overwrite && await this.isCacheValid(localPath)) {
          console.log('✅ Content already cached:', contentPath);
          return { localPath, cached: true, attempt };
        }

        // Get Firebase Storage URL
        const fileRef = ref(storage, contentPath);
        const downloadUrl = await getDownloadURL(fileRef);
        const metadata = await getMetadata(fileRef);
        
        // Execute download
        const result = await this.downloadAndCache(
          downloadUrl, 
          localPath, 
          metadata, 
          progressCallback
        );
        
        console.log(`✅ Download completed (attempt ${attempt}):`, contentPath);
        return { localPath: result, cached: true, attempt };
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Download attempt ${attempt} failed:`, error.message);
        
        if (attempt < RETRY_ATTEMPTS) {
          // Exponential backoff
          const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
          console.log(`⏱️ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Download failed after ${RETRY_ATTEMPTS} attempts: ${lastError.message}`);
  }

  /**
   * Download file and cache it locally
   */
  async downloadAndCache(downloadUrl, localPath, metadata, progressCallback) {
    try {
      // Ensure directory exists
      const directory = localPath.substring(0, localPath.lastIndexOf('/'));
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      
      // Check available space
      await this.ensureSpaceAvailable(metadata.size);
      
      // Download with progress tracking
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        localPath,
        {
          progressHandler: progressCallback ? (progress) => {
            progressCallback({
              loaded: progress.totalBytesWritten,
              total: progress.totalBytesExpectedToWrite,
              percentage: (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100
            });
          } : undefined
        }
      );
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
      
      // Update cache metadata
      await this.updateCacheMetadata(localPath, {
        originalPath: downloadUrl,
        size: metadata.size,
        contentType: metadata.contentType,
        downloadedAt: Date.now(),
        lastAccessed: Date.now()
      });
      
      console.log('📁 File cached successfully:', localPath);
      return localPath;
    } catch (error) {
      // Clean up partial download
      try {
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(localPath);
        }
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup partial download:', cleanupError);
      }
      
      throw error;
    }
  }

  /**
   * Progressive loading for video content
   */
  async setupProgressiveLoading(contentPath, videoElement, options = {}) {
    try {
      const {
        chunkSize = PROGRESSIVE_CHUNK_SIZE,
        preloadAmount = 0.1, // Preload 10% of the video
        qualityAdaptation = true
      } = options;

      // Get optimal quality based on current network
      let currentQuality = this.getOptimalQuality(contentPath);
      
      // Get content info
      const fileRef = ref(storage, contentPath);
      const metadata = await getMetadata(fileRef);
      
      // Calculate preload size
      const preloadSize = Math.min(
        metadata.size * preloadAmount,
        chunkSize * 3 // At least 3 chunks
      );
      
      // Start progressive loading
      const progressiveLoader = {
        contentPath,
        totalSize: metadata.size,
        loadedBytes: 0,
        currentQuality,
        isLoading: false,
        buffer: []
      };
      
      // Preload initial chunks
      await this.preloadChunks(progressiveLoader, preloadSize);
      
      // Set up quality adaptation if enabled
      if (qualityAdaptation) {
        this.setupQualityAdaptation(progressiveLoader);
      }
      
      return progressiveLoader;
    } catch (error) {
      console.error('❌ Error setting up progressive loading:', error);
      throw error;
    }
  }

  /**
   * Preload specific content for immediate access
   */
  async preloadContent(contentList, options = {}) {
    try {
      const {
        maxConcurrent = this.networkSettings.maxConcurrentDownloads,
        priority = 'normal',
        qualityOverride = null
      } = options;

      console.log('🔄 Preloading content:', contentList.length, 'items');
      
      const preloadPromises = [];
      const semaphore = new Map(); // Track concurrent downloads
      
      for (const contentItem of contentList) {
        const contentPath = typeof contentItem === 'string' ? contentItem : contentItem.path;
        const quality = qualityOverride || contentItem.quality || 'auto';
        
        // Wait for slot if at concurrent limit
        while (semaphore.size >= maxConcurrent) {
          await Promise.race(Array.from(semaphore.values()));
        }
        
        // Start download
        const downloadPromise = this.downloadContent(contentPath, {
          quality,
          priority,
          progressCallback: (progress) => {
            // Optionally emit progress events
            console.log(`📥 Preloading ${contentPath}: ${progress.percentage.toFixed(1)}%`);
          }
        });
        
        // Track and clean up
        const downloadId = this.generateDownloadId(contentPath, quality);
        semaphore.set(downloadId, downloadPromise);
        
        downloadPromise.finally(() => {
          semaphore.delete(downloadId);
        });
        
        preloadPromises.push(downloadPromise);
      }
      
      // Wait for all preloads to complete
      const results = await Promise.allSettled(preloadPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`✅ Preload completed: ${successful} successful, ${failed} failed`);
      
      return {
        successful,
        failed,
        results: results.map((result, index) => ({
          contentPath: contentList[index],
          status: result.status,
          result: result.status === 'fulfilled' ? result.value : result.reason
        }))
      };
    } catch (error) {
      console.error('❌ Error preloading content:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics and management info
   */
  async getCacheStats() {
    try {
      const stats = {
        totalSize: 0,
        fileCount: 0,
        categories: {
          videos: { size: 0, count: 0 },
          images: { size: 0, count: 0 },
          documents: { size: 0, count: 0 }
        },
        oldestFile: null,
        newestFile: null,
        hitRate: 0,
        networkSavings: 0
      };

      // Analyze cache directories
      const directories = [
        { path: VIDEO_CACHE_DIR, category: 'videos' },
        { path: IMAGE_CACHE_DIR, category: 'images' },
        { path: DOCUMENT_CACHE_DIR, category: 'documents' }
      ];

      for (const { path, category } of directories) {
        try {
          const dirInfo = await FileSystem.getInfoAsync(path);
          if (dirInfo.exists) {
            const files = await FileSystem.readDirectoryAsync(path);
            
            for (const file of files) {
              const filePath = `${path}${file}`;
              const fileInfo = await FileSystem.getInfoAsync(filePath);
              
              if (fileInfo.exists) {
                stats.totalSize += fileInfo.size || 0;
                stats.fileCount++;
                stats.categories[category].size += fileInfo.size || 0;
                stats.categories[category].count++;
                
                const modificationTime = fileInfo.modificationTime || 0;
                if (!stats.oldestFile || modificationTime < stats.oldestFile) {
                  stats.oldestFile = modificationTime;
                }
                if (!stats.newestFile || modificationTime > stats.newestFile) {
                  stats.newestFile = modificationTime;
                }
              }
            }
          }
        } catch (dirError) {
          console.warn(`⚠️ Error analyzing ${category} cache:`, dirError);
        }
      }

      // Calculate hit rate and network savings from metadata
      const metadata = Array.from(this.cacheMetadata.values());
      const totalAccesses = metadata.reduce((sum, meta) => sum + (meta.accessCount || 0), 0);
      const cacheHits = metadata.reduce((sum, meta) => sum + (meta.accessCount || 0) - 1, 0);
      
      stats.hitRate = totalAccesses > 0 ? (cacheHits / totalAccesses) * 100 : 0;
      stats.networkSavings = metadata.reduce((sum, meta) => 
        sum + ((meta.accessCount || 0) - 1) * (meta.size || 0), 0
      );

      return stats;
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Clean up cache based on various strategies
   */
  async cleanupCache(strategy = 'auto', options = {}) {
    try {
      const {
        maxSize = this.networkSettings.maxCacheSize * 1024 * 1024, // Convert MB to bytes
        maxAge = this.networkSettings.cacheExpiryHours * 60 * 60 * 1000, // Convert hours to ms
        preserveRecent = 10 // Always keep 10 most recent files
      } = options;

      console.log('🧹 Starting cache cleanup with strategy:', strategy);
      
      let cleanupCount = 0;
      let bytesFreed = 0;
      
      switch (strategy) {
        case 'size':
          ({ cleanupCount, bytesFreed } = await this.cleanupBySize(maxSize, preserveRecent));
          break;
        case 'age':
          ({ cleanupCount, bytesFreed } = await this.cleanupByAge(maxAge, preserveRecent));
          break;
        case 'lru':
          ({ cleanupCount, bytesFreed } = await this.cleanupByLRU(maxSize, preserveRecent));
          break;
        case 'auto':
        default:
          // Intelligent cleanup based on current conditions
          const stats = await this.getCacheStats();
          if (stats.totalSize > maxSize) {
            ({ cleanupCount, bytesFreed } = await this.cleanupByLRU(maxSize, preserveRecent));
          } else {
            ({ cleanupCount, bytesFreed } = await this.cleanupByAge(maxAge, preserveRecent));
          }
      }
      
      console.log(`✅ Cache cleanup completed: ${cleanupCount} files, ${this.formatBytes(bytesFreed)} freed`);
      
      return {
        filesRemoved: cleanupCount,
        bytesFreed,
        strategy
      };
    } catch (error) {
      console.error('❌ Error during cache cleanup:', error);
      throw error;
    }
  }

  /**
   * Update network settings
   */
  async updateNetworkSettings(settings) {
    try {
      this.networkSettings = {
        ...this.defaultNetworkSettings,
        ...this.networkSettings,
        ...settings
      };
      
      await this.saveNetworkSettings();
      
      // Apply settings immediately
      if (settings.maxConcurrentDownloads !== undefined) {
        // Adjust active downloads if needed
        await this.adjustConcurrentDownloads();
      }
      
      console.log('⚙️ Network settings updated');
      return this.networkSettings;
    } catch (error) {
      console.error('❌ Error updating network settings:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  /**
   * Determine optimal quality based on network conditions
   */
  getOptimalQuality(contentPath) {
    if (!this.networkState) return 'medium';
    
    const networkType = this.networkState.type;
    const effectiveType = this.networkState.details?.effectiveType || networkType;
    
    const mediaType = this.getMediaType(contentPath);
    const qualitySetting = this.qualitySettings[effectiveType] || this.qualitySettings['unknown'];
    
    return qualitySetting[mediaType] || 'medium';
  }

  /**
   * Get media type from content path
   */
  getMediaType(contentPath) {
    const extension = contentPath.toLowerCase().split('.').pop();
    
    if (['mp4', 'mov', 'avi', 'webm'].includes(extension)) return 'video';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) return 'image';
    return 'document';
  }

  /**
   * Generate cache key
   */
  generateCacheKey(contentPath, quality) {
    return `${contentPath}_${quality}`.replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Generate download ID
   */
  generateDownloadId(contentPath, quality) {
    return `download_${this.generateCacheKey(contentPath, quality)}`;
  }

  /**
   * Get local cache path for content
   */
  async getLocalCachePath(contentPath, quality) {
    const mediaType = this.getMediaType(contentPath);
    const fileName = `${this.generateCacheKey(contentPath, quality)}`;
    
    let baseDir;
    switch (mediaType) {
      case 'video':
        baseDir = VIDEO_CACHE_DIR;
        break;
      case 'image':
        baseDir = IMAGE_CACHE_DIR;
        break;
      default:
        baseDir = DOCUMENT_CACHE_DIR;
    }
    
    return `${baseDir}${fileName}`;
  }

  /**
   * Check if cached content is valid
   */
  async isCacheValid(localPath) {
    try {
      const fileInfo = await FileSystem.getInfoExists(localPath);
      if (!fileInfo.exists) return false;
      
      const metadata = this.cacheMetadata.get(localPath);
      if (!metadata) return false;
      
      // Check expiry
      const maxAge = this.networkSettings.cacheExpiryHours * 60 * 60 * 1000;
      const age = Date.now() - metadata.downloadedAt;
      
      if (age > maxAge) {
        console.log('⏰ Cache expired:', localPath);
        return false;
      }
      
      // Update access time
      metadata.lastAccessed = Date.now();
      metadata.accessCount = (metadata.accessCount || 0) + 1;
      
      return true;
    } catch (error) {
      console.warn('⚠️ Error checking cache validity:', error);
      return false;
    }
  }

  /**
   * Find any cached version of content
   */
  async findCachedVersion(contentPath) {
    const qualities = ['low', 'medium', 'high'];
    
    for (const quality of qualities) {
      const localPath = await this.getLocalCachePath(contentPath, quality);
      if (await this.isCacheValid(localPath)) {
        return {
          url: localPath,
          source: 'cache',
          quality,
          cached: true
        };
      }
    }
    
    return null;
  }

  /**
   * Check if we should download now based on network conditions
   */
  shouldDownloadNow(contentPath) {
    if (!this.networkState) return true;
    
    // Check WiFi-only setting
    if (this.networkSettings.wifiOnlyDownloads && this.networkState.type !== 'wifi') {
      const mediaType = this.getMediaType(contentPath);
      // Allow small images and documents on cellular
      if (mediaType === 'video') return false;
    }
    
    // Check connection quality
    const effectiveType = this.networkState.details?.effectiveType;
    if (['slow-2g', '2g'].includes(effectiveType)) {
      return false; // Too slow for downloads
    }
    
    return true;
  }

  /**
   * Queue content for background download
   */
  queueForDownload(downloadUrl, localPath, metadata, quality) {
    this.downloadQueue.push({
      id: this.generateDownloadId(localPath, quality),
      downloadUrl,
      localPath,
      metadata,
      quality,
      addedAt: Date.now(),
      attempts: 0
    });
    
    // Process queue
    this.processDownloadQueue();
  }

  /**
   * Process download queue
   */
  async processDownloadQueue() {
    if (this.activeDownloads.size >= this.networkSettings.maxConcurrentDownloads) {
      return; // Already at capacity
    }
    
    while (this.downloadQueue.length > 0 && 
           this.activeDownloads.size < this.networkSettings.maxConcurrentDownloads) {
      
      const item = this.downloadQueue.shift();
      
      try {
        const downloadPromise = this.downloadAndCache(
          item.downloadUrl,
          item.localPath,
          item.metadata
        );
        
        this.activeDownloads.set(item.id, downloadPromise);
        
        downloadPromise.finally(() => {
          this.activeDownloads.delete(item.id);
          // Continue processing queue
          this.processDownloadQueue();
        });
        
      } catch (error) {
        console.warn('⚠️ Failed to start queued download:', error);
        
        // Retry logic
        if (item.attempts < RETRY_ATTEMPTS) {
          item.attempts++;
          this.downloadQueue.push(item);
        }
      }
    }
  }

  /**
   * Set up network monitoring
   */
  async setupNetworkMonitoring() {
    try {
      // Get initial network state
      this.networkState = await NetInfo.fetch();
      
      // Subscribe to network changes
      this.networkUnsubscribe = NetInfo.addEventListener(state => {
        console.log('📡 Network state changed:', state.type, state.isConnected);
        this.networkState = state;
        
        // Adjust download strategy based on new network conditions
        this.onNetworkChange(state);
      });
      
    } catch (error) {
      console.warn('⚠️ Error setting up network monitoring:', error);
    }
  }

  /**
   * Handle network state changes
   */
  onNetworkChange(networkState) {
    // Pause downloads on poor connections
    if (['slow-2g', '2g'].includes(networkState.details?.effectiveType)) {
      console.log('📵 Pausing downloads due to poor connection');
      this.downloadQueue = []; // Clear queue
    }
    
    // Resume downloads on good connections
    if (['3g', '4g', '5g', 'wifi'].includes(networkState.type)) {
      console.log('📶 Resuming downloads on good connection');
      this.processDownloadQueue();
    }
  }

  /**
   * Ensure cache directories exist
   */
  async ensureCacheDirectories() {
    const directories = [CACHE_DIR, VIDEO_CACHE_DIR, IMAGE_CACHE_DIR, DOCUMENT_CACHE_DIR];
    
    for (const dir of directories) {
      try {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      } catch (error) {
        if (error.code !== 'ERR_FILESYSTEM_PATH_EXISTS') {
          console.warn('⚠️ Error creating cache directory:', dir, error);
        }
      }
    }
  }

  /**
   * Ensure enough space is available for download
   */
  async ensureSpaceAvailable(requiredBytes) {
    try {
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      const buffer = 100 * 1024 * 1024; // 100MB buffer
      
      if (freeSpace - requiredBytes < buffer) {
        console.log('💾 Low disk space, cleaning cache...');
        await this.cleanupCache('lru', { 
          maxSize: this.networkSettings.maxCacheSize * 0.7 * 1024 * 1024 // Keep 70% of max
        });
      }
    } catch (error) {
      console.warn('⚠️ Error checking disk space:', error);
    }
  }

  /**
   * Update cache metadata
   */
  async updateCacheMetadata(localPath, metadata) {
    this.cacheMetadata.set(localPath, metadata);
    await this.saveCacheMetadata();
  }

  /**
   * Format bytes for display
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Cache management methods
   */

  async cleanupBySize(maxSize, preserveRecent) {
    // Implementation for size-based cleanup
    return { cleanupCount: 0, bytesFreed: 0 };
  }

  async cleanupByAge(maxAge, preserveRecent) {
    // Implementation for age-based cleanup
    return { cleanupCount: 0, bytesFreed: 0 };
  }

  async cleanupByLRU(maxSize, preserveRecent) {
    // Implementation for LRU-based cleanup
    return { cleanupCount: 0, bytesFreed: 0 };
  }

  /**
   * Persistence methods
   */

  async loadFromCache() {
    try {
      const [queueData, metadataData] = await Promise.all([
        AsyncStorage.getItem(DOWNLOAD_QUEUE_KEY),
        AsyncStorage.getItem(CACHE_METADATA_KEY)
      ]);

      if (queueData) {
        this.downloadQueue = JSON.parse(queueData) || [];
      }

      if (metadataData) {
        const metadata = JSON.parse(metadataData);
        this.cacheMetadata = new Map(metadata.entries || []);
      }
    } catch (error) {
      console.warn('⚠️ Error loading content delivery cache:', error);
    }
  }

  async saveToCache() {
    try {
      await Promise.all([
        AsyncStorage.setItem(DOWNLOAD_QUEUE_KEY, JSON.stringify(this.downloadQueue)),
        this.saveCacheMetadata()
      ]);
    } catch (error) {
      console.warn('⚠️ Error saving content delivery cache:', error);
    }
  }

  async saveCacheMetadata() {
    try {
      const metadataData = {
        entries: Array.from(this.cacheMetadata.entries()),
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadataData));
    } catch (error) {
      console.warn('⚠️ Error saving cache metadata:', error);
    }
  }

  async loadNetworkSettings() {
    try {
      const cached = await AsyncStorage.getItem(NETWORK_SETTINGS_KEY);
      if (cached) {
        this.networkSettings = { ...this.defaultNetworkSettings, ...JSON.parse(cached) };
      } else {
        this.networkSettings = { ...this.defaultNetworkSettings };
      }
    } catch (error) {
      console.warn('⚠️ Error loading network settings:', error);
      this.networkSettings = { ...this.defaultNetworkSettings };
    }
  }

  async saveNetworkSettings() {
    try {
      await AsyncStorage.setItem(NETWORK_SETTINGS_KEY, JSON.stringify(this.networkSettings));
    } catch (error) {
      console.warn('⚠️ Error saving network settings:', error);
    }
  }

  async resumeInterruptedDownloads() {
    // Resume any downloads that were interrupted
    if (this.downloadQueue.length > 0) {
      console.log('🔄 Resuming interrupted downloads:', this.downloadQueue.length);
      this.processDownloadQueue();
    }
  }

  async cleanupExpiredCache() {
    // Clean up expired cache entries
    const maxAge = this.networkSettings.cacheExpiryHours * 60 * 60 * 1000;
    const now = Date.now();
    
    for (const [path, metadata] of this.cacheMetadata.entries()) {
      if (now - metadata.downloadedAt > maxAge) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(path);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(path);
          }
          this.cacheMetadata.delete(path);
        } catch (error) {
          console.warn('⚠️ Error cleaning expired cache:', error);
        }
      }
    }
    
    await this.saveCacheMetadata();
  }

  async adjustConcurrentDownloads() {
    // Adjust concurrent downloads based on new settings
    while (this.activeDownloads.size < this.networkSettings.maxConcurrentDownloads && 
           this.downloadQueue.length > 0) {
      this.processDownloadQueue();
    }
  }

  async getCacheSize() {
    try {
      const stats = await this.getCacheStats();
      return stats ? this.formatBytes(stats.totalSize) : '0 Bytes';
    } catch (error) {
      return '0 Bytes';
    }
  }

  /**
   * Mobile Performance Optimization Methods
   */

  /**
   * Adaptive quality selection based on device and network performance
   */
  async getAdaptiveQuality(contentPath, options = {}) {
    try {
      const {
        devicePerformance = this.getDevicePerformanceClass(),
        networkCondition = this.getNetworkCondition(),
        userPreferences = {},
        contentType = this.getMediaType(contentPath)
      } = options;

      // Check if we have performance data for this content
      const performanceData = this.performanceMetrics.get(contentPath);
      
      let optimalQuality = 'medium'; // Default fallback

      // Device-based quality adjustment
      const deviceQuality = this.getDeviceOptimalQuality(devicePerformance, contentType);
      
      // Network-based quality adjustment
      const networkQuality = this.getNetworkOptimalQuality(networkCondition, contentType);
      
      // Take the more conservative choice
      optimalQuality = this.selectConservativeQuality([deviceQuality, networkQuality]);

      // Apply performance-based adjustments if available
      if (performanceData) {
        optimalQuality = this.adjustQualityBasedOnPerformance(
          optimalQuality, 
          performanceData, 
          contentType
        );
      }

      // Apply user preferences
      if (userPreferences.qualityPreference) {
        optimalQuality = this.applyUserQualityPreference(
          optimalQuality,
          userPreferences.qualityPreference,
          networkCondition
        );
      }

      // Cache the result for future use
      this.adaptiveQuality.set(contentPath, {
        quality: optimalQuality,
        timestamp: Date.now(),
        devicePerformance,
        networkCondition
      });

      return optimalQuality;
    } catch (error) {
      console.error('❌ Error determining adaptive quality:', error);
      return 'medium'; // Safe fallback
    }
  }

  /**
   * Track content performance metrics for adaptive optimization
   */
  async trackContentPerformance(contentPath, metrics) {
    try {
      const existingData = this.performanceMetrics.get(contentPath) || {
        loadTimes: [],
        failureRate: 0,
        totalRequests: 0,
        totalFailures: 0
      };

      // Update metrics
      if (metrics.loadTime) {
        existingData.loadTimes.push(metrics.loadTime);
        // Keep only recent 20 load times
        if (existingData.loadTimes.length > 20) {
          existingData.loadTimes = existingData.loadTimes.slice(-20);
        }
      }

      existingData.totalRequests++;
      if (metrics.failed) {
        existingData.totalFailures++;
      }

      existingData.failureRate = existingData.totalFailures / existingData.totalRequests;
      existingData.averageLoadTime = existingData.loadTimes.length > 0
        ? existingData.loadTimes.reduce((sum, time) => sum + time, 0) / existingData.loadTimes.length
        : 0;

      // Update timestamp
      existingData.lastUpdated = Date.now();

      this.performanceMetrics.set(contentPath, existingData);

      // Save performance metrics periodically
      if (existingData.totalRequests % 5 === 0) {
        await this.savePerformanceMetrics();
      }

      return existingData;
    } catch (error) {
      console.error('❌ Error tracking content performance:', error);
    }
  }

  /**
   * Intelligent preloading based on user behavior and network conditions
   */
  async intelligentPreload(contentList, userBehavior = {}) {
    try {
      console.log('🧠 Starting intelligent preload for', contentList.length, 'items');

      // Analyze content priority based on user behavior
      const prioritizedContent = this.prioritizeContentForPreload(contentList, userBehavior);
      
      // Check current network conditions
      const canPreload = this.shouldPreloadNow();
      if (!canPreload) {
        console.log('📵 Network conditions not suitable for preloading');
        return { preloaded: 0, skipped: prioritizedContent.length };
      }

      // Determine optimal preload strategy
      const preloadStrategy = this.getPreloadStrategy();
      
      let preloadedCount = 0;
      const maxPreload = preloadStrategy.maxConcurrent;

      // Preload high-priority content first
      for (let i = 0; i < Math.min(maxPreload, prioritizedContent.length); i++) {
        const content = prioritizedContent[i];
        
        try {
          // Check if already cached
          const localPath = await this.getLocalCachePath(content.path, content.quality || 'auto');
          if (await this.isCacheValid(localPath)) {
            console.log('✅ Content already cached:', content.path);
            continue;
          }

          // Start preload
          const preloadPromise = this.downloadContent(content.path, {
            quality: await this.getAdaptiveQuality(content.path),
            priority: content.priority || 'normal'
          });

          preloadedCount++;
          console.log(`📥 Preloading (${i + 1}/${maxPreload}):`, content.path);

          // Don't await - let it download in background
          preloadPromise.catch(error => {
            console.warn('⚠️ Preload failed for:', content.path, error.message);
          });

        } catch (error) {
          console.warn('⚠️ Error starting preload for:', content.path, error);
        }
      }

      return {
        preloaded: preloadedCount,
        skipped: prioritizedContent.length - preloadedCount,
        strategy: preloadStrategy.name
      };
    } catch (error) {
      console.error('❌ Error in intelligent preload:', error);
      return { preloaded: 0, skipped: contentList.length };
    }
  }

  /**
   * Bandwidth-aware streaming with quality adjustment
   */
  async setupBandwidthAwareStreaming(contentPath, options = {}) {
    try {
      const {
        initialQuality = 'auto',
        enableAdaptation = true,
        bufferTarget = 10000, // 10 seconds
        qualityLevels = ['low', 'medium', 'high']
      } = options;

      // Start with adaptive quality
      let currentQuality = initialQuality === 'auto' 
        ? await this.getAdaptiveQuality(contentPath)
        : initialQuality;

      // Set up streaming controller
      const streamingController = {
        contentPath,
        currentQuality,
        qualityLevels,
        enableAdaptation,
        bufferTarget,
        
        // Performance monitoring
        downloadSpeed: 0,
        bufferLevel: 0,
        lastQualityChange: Date.now(),
        
        // Quality adjustment methods
        upgradeQuality: () => this.upgradeStreamingQuality(streamingController),
        downgradeQuality: () => this.downgradeStreamingQuality(streamingController),
        
        // Performance tracking
        updateMetrics: (metrics) => this.updateStreamingMetrics(streamingController, metrics)
      };

      // Start performance monitoring if adaptation is enabled
      if (enableAdaptation) {
        this.startStreamingMonitoring(streamingController);
      }

      return streamingController;
    } catch (error) {
      console.error('❌ Error setting up bandwidth-aware streaming:', error);
      return null;
    }
  }

  /**
   * Optimize cache based on usage patterns and device constraints
   */
  async optimizeCacheForMobile() {
    try {
      console.log('📱 Optimizing cache for mobile performance...');

      // Get current cache statistics
      const stats = await this.getCacheStats();
      if (!stats) return;

      // Analyze usage patterns
      const usageAnalysis = this.analyzeCacheUsage();
      
      // Determine optimization strategy
      const optimizationPlan = this.createCacheOptimizationPlan(stats, usageAnalysis);
      
      let optimizationResults = {
        filesRemoved: 0,
        bytesFreed: 0,
        filesOptimized: 0,
        strategy: optimizationPlan.strategy
      };

      // Execute optimization steps
      for (const step of optimizationPlan.steps) {
        try {
          const stepResult = await this.executeCacheOptimizationStep(step);
          optimizationResults.filesRemoved += stepResult.filesRemoved || 0;
          optimizationResults.bytesFreed += stepResult.bytesFreed || 0;
          optimizationResults.filesOptimized += stepResult.filesOptimized || 0;
        } catch (stepError) {
          console.warn('⚠️ Cache optimization step failed:', step.type, stepError);
        }
      }

      // Update performance metrics
      await this.savePerformanceMetrics();

      console.log('✅ Cache optimization completed:', optimizationResults);
      return optimizationResults;
    } catch (error) {
      console.error('❌ Error optimizing cache for mobile:', error);
      return null;
    }
  }

  /**
   * Private mobile optimization helper methods
   */

  getDevicePerformanceClass() {
    // This would typically use device detection libraries
    // For now, return based on platform
    if (Platform.OS === 'ios') {
      return 'high'; // iOS devices generally have good performance
    } else {
      return 'medium'; // Android varies widely
    }
  }

  getNetworkCondition() {
    if (!this.networkState) return 'unknown';
    
    const { type, details } = this.networkState;
    
    if (type === 'wifi') return 'excellent';
    if (type === 'cellular') {
      const effectiveType = details?.effectiveType;
      if (effectiveType === '4g' || effectiveType === '5g') return 'good';
      if (effectiveType === '3g') return 'fair';
      return 'poor';
    }
    
    return 'unknown';
  }

  getDeviceOptimalQuality(performanceClass, contentType) {
    const qualityMatrix = {
      'high': {
        'video': 'high',
        'image': 'high',
        'document': 'high'
      },
      'medium': {
        'video': 'medium',
        'image': 'medium',
        'document': 'medium'
      },
      'low': {
        'video': 'low',
        'image': 'low',
        'document': 'low'
      }
    };

    return qualityMatrix[performanceClass]?.[contentType] || 'medium';
  }

  getNetworkOptimalQuality(networkCondition, contentType) {
    const qualityMatrix = {
      'excellent': {
        'video': 'high',
        'image': 'high',
        'document': 'high'
      },
      'good': {
        'video': 'medium',
        'image': 'medium',
        'document': 'high'
      },
      'fair': {
        'video': 'low',
        'image': 'medium',
        'document': 'medium'
      },
      'poor': {
        'video': 'low',
        'image': 'low',
        'document': 'low'
      }
    };

    return qualityMatrix[networkCondition]?.[contentType] || 'medium';
  }

  selectConservativeQuality(qualities) {
    const qualityRanking = { 'low': 1, 'medium': 2, 'high': 3 };
    return qualities.reduce((conservative, current) => 
      qualityRanking[current] < qualityRanking[conservative] ? current : conservative
    );
  }

  adjustQualityBasedOnPerformance(baseQuality, performanceData, contentType) {
    // If failure rate is high, downgrade quality
    if (performanceData.failureRate > 0.2) {
      return this.downgradeQuality(baseQuality);
    }
    
    // If load times are consistently fast, we could upgrade
    if (performanceData.averageLoadTime && performanceData.averageLoadTime < 2000) {
      // Only upgrade if we have enough data points and network is good
      if (performanceData.loadTimes.length >= 5 && this.getNetworkCondition() === 'excellent') {
        return this.upgradeQuality(baseQuality);
      }
    }
    
    return baseQuality;
  }

  upgradeQuality(currentQuality) {
    const upgrades = { 'low': 'medium', 'medium': 'high', 'high': 'high' };
    return upgrades[currentQuality] || currentQuality;
  }

  downgradeQuality(currentQuality) {
    const downgrades = { 'high': 'medium', 'medium': 'low', 'low': 'low' };
    return downgrades[currentQuality] || currentQuality;
  }

  applyUserQualityPreference(adaptiveQuality, userPreference, networkCondition) {
    // If user prefers high quality and network is good, allow it
    if (userPreference === 'high' && ['excellent', 'good'].includes(networkCondition)) {
      return 'high';
    }
    
    // If user prefers data saving, always use low
    if (userPreference === 'data_saver') {
      return 'low';
    }
    
    // Otherwise use adaptive quality
    return adaptiveQuality;
  }

  prioritizeContentForPreload(contentList, userBehavior) {
    return contentList
      .map(content => ({
        ...content,
        priority: this.calculatePreloadPriority(content, userBehavior)
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  calculatePreloadPriority(content, userBehavior) {
    let priority = 50; // Base priority
    
    // Boost priority for content in user's preferred categories
    if (userBehavior.favoriteCategories?.includes(content.category)) {
      priority += 20;
    }
    
    // Boost priority for content similar to recently viewed
    if (userBehavior.recentlyViewed?.some(viewed => 
      viewed.category === content.category || viewed.difficulty === content.difficulty
    )) {
      priority += 15;
    }
    
    // Boost priority for shorter content (easier to preload)
    if (content.estimatedDuration < 300) { // Less than 5 minutes
      priority += 10;
    }
    
    // Lower priority for large files on poor networks
    if (content.fileSize > 10 * 1024 * 1024 && this.getNetworkCondition() === 'poor') {
      priority -= 30;
    }
    
    return priority;
  }

  shouldPreloadNow() {
    const networkCondition = this.getNetworkCondition();
    
    // Don't preload on poor connections
    if (networkCondition === 'poor') return false;
    
    // Check WiFi-only setting
    if (this.networkSettings.wifiOnlyDownloads && this.networkState?.type !== 'wifi') {
      return false;
    }
    
    // Check if we're already at download capacity
    if (this.activeDownloads.size >= this.networkSettings.maxConcurrentDownloads) {
      return false;
    }
    
    return true;
  }

  getPreloadStrategy() {
    const networkCondition = this.getNetworkCondition();
    
    const strategies = {
      'excellent': { name: 'aggressive', maxConcurrent: 5, qualityTarget: 'high' },
      'good': { name: 'moderate', maxConcurrent: 3, qualityTarget: 'medium' },
      'fair': { name: 'conservative', maxConcurrent: 2, qualityTarget: 'low' },
      'poor': { name: 'minimal', maxConcurrent: 1, qualityTarget: 'low' }
    };
    
    return strategies[networkCondition] || strategies['fair'];
  }

  analyzeCacheUsage() {
    const now = Date.now();
    const analysis = {
      frequentlyAccessed: [],
      rarelyAccessed: [],
      recentlyAdded: [],
      oldContent: []
    };
    
    for (const [path, metadata] of this.cacheMetadata.entries()) {
      const age = now - (metadata.downloadedAt || 0);
      const accessCount = metadata.accessCount || 0;
      const lastAccessed = metadata.lastAccessed || 0;
      const timeSinceAccess = now - lastAccessed;
      
      // Categorize based on usage patterns
      if (accessCount > 5) {
        analysis.frequentlyAccessed.push({ path, metadata });
      } else if (accessCount < 2 && timeSinceAccess > 7 * 24 * 60 * 60 * 1000) { // 7 days
        analysis.rarelyAccessed.push({ path, metadata });
      }
      
      if (age < 24 * 60 * 60 * 1000) { // 1 day
        analysis.recentlyAdded.push({ path, metadata });
      } else if (age > 30 * 24 * 60 * 60 * 1000) { // 30 days
        analysis.oldContent.push({ path, metadata });
      }
    }
    
    return analysis;
  }

  createCacheOptimizationPlan(stats, usageAnalysis) {
    const plan = {
      strategy: 'balanced',
      steps: []
    };
    
    // If cache is too large, prioritize size reduction
    const maxCacheSize = this.networkSettings.maxCacheSize * 1024 * 1024;
    if (stats.totalSize > maxCacheSize) {
      plan.strategy = 'aggressive_cleanup';
      plan.steps.push(
        { type: 'remove_rarely_accessed', targets: usageAnalysis.rarelyAccessed },
        { type: 'remove_old_content', targets: usageAnalysis.oldContent },
        { type: 'compress_large_files', targets: [] }
      );
    }
    
    // Otherwise, gentle optimization
    else {
      plan.strategy = 'gentle_optimization';
      plan.steps.push(
        { type: 'remove_expired', targets: [] },
        { type: 'compress_if_beneficial', targets: usageAnalysis.frequentlyAccessed }
      );
    }
    
    return plan;
  }

  async executeCacheOptimizationStep(step) {
    switch (step.type) {
      case 'remove_rarely_accessed':
        return await this.removeRarelyAccessedContent(step.targets);
      case 'remove_old_content':
        return await this.removeOldContent(step.targets);
      case 'remove_expired':
        return await this.removeExpiredContent();
      default:
        return { filesRemoved: 0, bytesFreed: 0, filesOptimized: 0 };
    }
  }

  async removeRarelyAccessedContent(targets) {
    let filesRemoved = 0;
    let bytesFreed = 0;
    
    for (const { path, metadata } of targets.slice(0, 10)) { // Limit to 10 files
      try {
        const fileInfo = await FileSystem.getInfoAsync(path);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(path);
          filesRemoved++;
          bytesFreed += metadata.size || 0;
          this.cacheMetadata.delete(path);
        }
      } catch (error) {
        console.warn('⚠️ Error removing rarely accessed content:', path, error);
      }
    }
    
    return { filesRemoved, bytesFreed };
  }

  async removeOldContent(targets) {
    let filesRemoved = 0;
    let bytesFreed = 0;
    
    for (const { path, metadata } of targets.slice(0, 5)) { // Limit to 5 files
      try {
        const fileInfo = await FileSystem.getInfoAsync(path);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(path);
          filesRemoved++;
          bytesFreed += metadata.size || 0;
          this.cacheMetadata.delete(path);
        }
      } catch (error) {
        console.warn('⚠️ Error removing old content:', path, error);
      }
    }
    
    return { filesRemoved, bytesFreed };
  }

  async removeExpiredContent() {
    const now = Date.now();
    const maxAge = this.networkSettings.cacheExpiryHours * 60 * 60 * 1000;
    let filesRemoved = 0;
    let bytesFreed = 0;
    
    for (const [path, metadata] of this.cacheMetadata.entries()) {
      const age = now - (metadata.downloadedAt || 0);
      if (age > maxAge) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(path);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(path);
            filesRemoved++;
            bytesFreed += metadata.size || 0;
            this.cacheMetadata.delete(path);
          }
        } catch (error) {
          console.warn('⚠️ Error removing expired content:', path, error);
        }
      }
    }
    
    return { filesRemoved, bytesFreed };
  }

  async savePerformanceMetrics() {
    try {
      const metricsData = {
        entries: Array.from(this.performanceMetrics.entries()),
        adaptiveQuality: Array.from(this.adaptiveQuality.entries()),
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(PERFORMANCE_METRICS_KEY, JSON.stringify(metricsData));
    } catch (error) {
      console.warn('⚠️ Error saving performance metrics:', error);
    }
  }

  async loadPerformanceMetrics() {
    try {
      const data = await AsyncStorage.getItem(PERFORMANCE_METRICS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.performanceMetrics = new Map(parsed.entries || []);
        this.adaptiveQuality = new Map(parsed.adaptiveQuality || []);
      }
    } catch (error) {
      console.warn('⚠️ Error loading performance metrics:', error);
    }
  }

  /**
   * Cleanup and destroy
   */
  async clearCache() {
    try {
      // Clear all cache directories
      const directories = [VIDEO_CACHE_DIR, IMAGE_CACHE_DIR, DOCUMENT_CACHE_DIR];
      
      for (const dir of directories) {
        try {
          const dirInfo = await FileSystem.getInfoAsync(dir);
          if (dirInfo.exists) {
            await FileSystem.deleteAsync(dir, { idempotent: true });
          }
        } catch (error) {
          console.warn('⚠️ Error clearing cache directory:', dir, error);
        }
      }
      
      // Clear memory caches
      this.cacheMetadata.clear();
      this.downloadQueue = [];
      this.activeDownloads.clear();
      
      // Clear persistent storage
      await AsyncStorage.multiRemove([
        CONTENT_CACHE_KEY,
        DOWNLOAD_QUEUE_KEY,
        CACHE_METADATA_KEY,
        NETWORK_SETTINGS_KEY
      ]);
      
      console.log('🗑️ Content delivery cache cleared');
    } catch (error) {
      console.error('❌ Error clearing content delivery cache:', error);
    }
  }

  destroy() {
    // Cancel network monitoring
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }
    
    // Cancel active downloads
    this.activeDownloads.clear();
    this.downloadQueue = [];
    
    // Clear caches
    this.cacheMetadata.clear();
    this.networkSettings = {};
    this.isInitialized = false;
    
    console.log('🔄 Content Delivery Service destroyed');
  }
}

// Create singleton instance
const contentDeliveryService = new ContentDeliveryService();

export default contentDeliveryService;