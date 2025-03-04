// src/types/index.ts
export interface AnalysisResult {
  analysis: string;
  error?: string;
}

// src/components/VideoUploader.tsx
import React, { useRef, useState } from 'react';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onFileSelect }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onFileSelect(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const clearSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setPreview(null);
  };

  return (
    <div className="video-uploader">
      <input
        type="file"
        accept="video/mp4,video/mov,video/avi"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="file-input"
      />
      
      {preview && (
        <div className="video-preview">
          <video src={preview} controls width="100%" />
          <button onClick={clearSelection} className="clear-button">
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;

// src/components/QueryInput.tsx
import React, { useState } from 'react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
}

const QueryInput: React.FC<QueryInputProps> = ({ onSubmit, disabled = false }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="query-input">
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="What would you like to know about this technique?"
        disabled={disabled}
      />
      <button 
        type="submit" 
        disabled={!query.trim() || disabled}
        className="submit-button"
      >
        {disabled ? 'Analyzing...' : '🔍 Analyze Technique'}
      </button>
    </form>
  );
};

export default QueryInput;

// src/components/MarkdownRenderer.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-renderer">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

// src/App.tsx
import React, { useState } from 'react';
import './App.css';
import VideoUploader from './components/VideoUploader';
import QueryInput from './components/QueryInput';
import MarkdownRenderer from './components/MarkdownRenderer';
import { AnalysisResult } from './types';

function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setVideoFile(file);
    // Reset analysis when a new file is selected
    setAnalysisResult(null);
  };

  const handleQuerySubmit = async (query: string) => {
    if (!videoFile) {
      setError('Please upload a video first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('query', query);

      const response = await fetch('https://your-project.supabase.co/functions/v1/bjj-analyzer', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result: AnalysisResult = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setAnalysisResult(result.analysis);
    } catch (err: any) {
      setError(`Failed to analyze video: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveAnalysis = () => {
    if (analysisResult) {
      const blob = new Blob([analysisResult], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bjj_technique_analysis.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>BJJ Video Analyzer 🥋</h1>
        <p className="App-subheader">Powered by Gemini 2.0 Flash</p>
      </header>

      <main className="App-main">
        <div className="App-container">
          <div className="upload-section">
            <h2>Upload Video</h2>
            <VideoUploader onFileSelect={handleFileSelect} />

            <div className="query-section">
              <QueryInput 
                onSubmit={handleQuerySubmit} 
                disabled={isAnalyzing || !videoFile} 
              />
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>

          {analysisResult && (
            <div className="analysis-section">
              <h2>📋 Expert BJJ Analysis</h2>
              <div className="markdown-content">
                <MarkdownRenderer content={analysisResult} />
              </div>
              <div className="action-buttons">
                <button onClick={saveAnalysis} className="save-button">
                  💾 Save Analysis
                </button>
                <button className="feedback-button">
                  👍 This analysis was helpful
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <aside className="App-sidebar">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Jiu-jitsu.svg/320px-Jiu-jitsu.svg.png"
          alt="BJJ Logo"
          width={150}
        />
        <h2>About This Tool</h2>
        <p>
          This analyzer provides technical BJJ feedback from uploaded videos using advanced AI.
        </p>
        <h3>Features:</h3>
        <ul>
          <li>Skill level assessment</li>
          <li>Technical feedback</li>
          <li>Targeted improvement drills</li>
          <li>Coaching insights</li>
        </ul>
        <h3>Models:</h3>
        <p>Gemini 2.0 Flash Exp for video analysis</p>
        <div className="divider"></div>
        <p><strong>Created by:</strong> Apply, Co.</p>
      </aside>
    </div>
  );
}

export default App;

// src/App.css
.App {
  display: grid;
  grid-template-columns: 3fr 1fr;
  grid-template-areas: 
    "header header"
    "main sidebar";
  min-height: 100vh;
  font-family: 'Helvetica Neue', sans-serif;
}

.App-header {
  grid-area: header;
  background-color: #ffffff;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e1e4e8;
}

.App-header h1 {
  margin-bottom: 0;
  color: #2C3E50;
}

.App-subheader {
  font-size: 1.2rem;
  color: #7F8C8D;
  margin-top: 0;
}

.App-main {
  grid-area: main;
  padding: 2rem;
  background-color: #f9f9f9;
}

.App-sidebar {
  grid-area: sidebar;
  padding: 2rem;
  background-color: #ffffff;
  border-left: 1px solid #e1e4e8;
}

.App-container {
  max-width: 1000px;
  margin: 0 auto;
}

.upload-section {
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.video-uploader .file-input {
  width: 100%;
  padding: 1rem;
  border: 2px dashed #e1e4e8;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.video-preview {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
}

.video-preview .clear-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
}

.query-section {
  margin-top: 1.5rem;
}

.query-input {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.query-input textarea {
  width: 100%;
  height: 120px;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #e1e4e8;
  font-size: 16px;
  resize: vertical;
}

.submit-button {
  background-color: #3498DB;
  color: white;
  border: none;
  font-weight: bold;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-end;
}

.submit-button:hover:not(:disabled) {
  background-color: #2980B9;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.submit-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.analysis-section {
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 5px solid #3498DB;
}

.markdown-content {
  max-height: 500px;
  overflow-y: auto;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.save-button, .feedback-button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-button {
  background-color: #27ae60;
  color: white;
}

.save-button:hover {
  background-color: #219653;
}

.feedback-button {
  background-color: #f39c12;
  color: white;
}

.feedback-button:hover {
  background-color: #e67e22;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.divider {
  height: 1px;
  background-color: #e1e4e8;
  margin: 1.5rem 0;
}

.markdown-renderer h2 {
  color: #2C3E50;
  border-bottom: 1px solid #e1e4e8;
  padding-bottom: 0.5rem;
}

.markdown-renderer ul {
  padding-left: 1.5rem;
}

.markdown-renderer p {
  line-height: 1.6;
}
