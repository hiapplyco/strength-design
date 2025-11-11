import React from 'react';

interface UploadStatusProps {
  publicUrl: string;
}

export const UploadStatus: React.FC<UploadStatusProps> = ({ publicUrl }) => {
  if (!publicUrl) return null;

  return (
    <div className="mt-4 p-4 bg-green-950/50 rounded-md">
      <p className="text-green-400 mb-2">Video uploaded successfully!</p>
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline"
      >
        View Video
      </a>
    </div>
  );
};