import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  uploadString,
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import { storage } from '../config';

export class StorageService {
  /**
   * Upload file to storage
   */
  static async uploadFile(
    path: string, 
    file: File | Blob,
    metadata?: { [key: string]: string }
  ): Promise<{ url: string; path: string }> {
    try {
      const storageRef = ref(storage, path);
      
      // Upload file with metadata
      const uploadResult = await uploadBytes(storageRef, file, {
        customMetadata: metadata,
      });
      
      // Get download URL
      const url = await getDownloadURL(uploadResult.ref);
      
      return { url, path: uploadResult.ref.fullPath };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Upload base64 string
   */
  static async uploadBase64(
    path: string,
    base64String: string,
    contentType: string,
    metadata?: { [key: string]: string }
  ): Promise<{ url: string; path: string }> {
    try {
      const storageRef = ref(storage, path);
      
      // Upload base64 string
      const uploadResult = await uploadString(storageRef, base64String, 'base64', {
        contentType,
        customMetadata: metadata,
      });
      
      // Get download URL
      const url = await getDownloadURL(uploadResult.ref);
      
      return { url, path: uploadResult.ref.fullPath };
    } catch (error) {
      console.error('Error uploading base64:', error);
      throw error;
    }
  }

  /**
   * Get file download URL
   */
  static async getFileUrl(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * List files in a directory
   */
  static async listFiles(path: string): Promise<{ name: string; path: string }[]> {
    try {
      const listRef = ref(storage, path);
      const result = await listAll(listRef);
      
      return result.items.map(item => ({
        name: item.name,
        path: item.fullPath,
      }));
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(path: string): Promise<{
    size: number;
    contentType?: string;
    created: Date;
    updated: Date;
    metadata?: { [key: string]: string };
  }> {
    try {
      const storageRef = ref(storage, path);
      const metadata = await getMetadata(storageRef);
      
      return {
        size: metadata.size,
        contentType: metadata.contentType,
        created: new Date(metadata.timeCreated),
        updated: new Date(metadata.updated),
        metadata: metadata.customMetadata,
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  /**
   * Update file metadata
   */
  static async updateFileMetadata(
    path: string,
    metadata: { [key: string]: string }
  ): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await updateMetadata(storageRef, {
        customMetadata: metadata,
      });
    } catch (error) {
      console.error('Error updating file metadata:', error);
      throw error;
    }
  }

  /**
   * Upload workout file
   */
  static async uploadWorkoutFile(
    userId: string,
    file: File
  ): Promise<{ url: string; path: string }> {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const path = `workout-uploads/${userId}/${fileName}`;
    
    return this.uploadFile(path, file, {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    });
  }

  /**
   * Upload nutrition file
   */
  static async uploadNutritionFile(
    userId: string,
    file: File
  ): Promise<{ url: string; path: string }> {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const path = `nutrition-uploads/${userId}/${fileName}`;
    
    return this.uploadFile(path, file, {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    });
  }

  /**
   * Upload video file
   */
  static async uploadVideo(
    userId: string,
    videoId: string,
    file: File
  ): Promise<{ url: string; path: string }> {
    const path = `videos/${userId}/${videoId}/${file.name}`;
    
    return this.uploadFile(path, file, {
      originalName: file.name,
      videoId,
      uploadedAt: new Date().toISOString(),
    });
  }

  /**
   * Upload progress photo
   */
  static async uploadProgressPhoto(
    userId: string,
    file: File,
    metadata?: {
      weight?: string;
      date?: string;
      notes?: string;
    }
  ): Promise<{ url: string; path: string }> {
    const timestamp = Date.now();
    const photoId = `photo_${timestamp}`;
    const path = `photos/${userId}/${photoId}/${file.name}`;
    
    return this.uploadFile(path, file, {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      ...metadata,
    });
  }

  /**
   * Upload voice recording
   */
  static async uploadVoiceRecording(
    userId: string,
    workoutId: string,
    audioBlob: Blob
  ): Promise<{ url: string; path: string }> {
    const timestamp = Date.now();
    const recordingId = `recording_${timestamp}`;
    const path = `voice-recordings/${userId}/${workoutId}/${recordingId}.mp3`;
    
    return this.uploadFile(path, audioBlob, {
      workoutId,
      recordedAt: new Date().toISOString(),
    });
  }

  /**
   * Get user storage usage
   */
  static async getUserStorageUsage(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byCategory: Record<string, { count: number; size: number }>;
  }> {
    try {
      const categories = [
        'workout-uploads',
        'nutrition-uploads',
        'videos',
        'photos',
        'voice-recordings',
      ];
      
      let totalFiles = 0;
      let totalSize = 0;
      const byCategory: Record<string, { count: number; size: number }> = {};
      
      for (const category of categories) {
        const path = `${category}/${userId}`;
        try {
          const files = await this.listFiles(path);
          let categorySize = 0;
          
          for (const file of files) {
            const metadata = await this.getFileMetadata(file.path);
            categorySize += metadata.size;
          }
          
          byCategory[category] = {
            count: files.length,
            size: categorySize,
          };
          
          totalFiles += files.length;
          totalSize += categorySize;
        } catch (error) {
          // Directory might not exist
          byCategory[category] = { count: 0, size: 0 };
        }
      }
      
      return { totalFiles, totalSize, byCategory };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      throw error;
    }
  }
}