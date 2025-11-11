
export interface AnalysisResult {
  analysis: string;
  error?: string;
}

export interface VideoAnalysisRequest {
  videoUrl: string;
  userPrompt?: string;
}

export interface VideoAnalysisResponse {
  result: string;
  error?: string;
}

export interface UploadResponse {
  url: string;
  error?: string;
}

export interface ProcessingStatus {
  status: 'processing' | 'completed' | 'error';
  message?: string;
}
