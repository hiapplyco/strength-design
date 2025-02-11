
import React from 'react';
import { VideoPreview } from './VideoPreview';
import { VideoControls } from './VideoControls';
import { UploadStatus } from './UploadStatus';
import { useWebcam } from './hooks/useWebcam';
import { useRecording } from './hooks/useRecording';
import { useVideoUpload } from './hooks/useVideoUpload';

interface VideoRecorderProps {
  onNarrate?: () => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ onNarrate }) => {
  const { videoRef, streamRef, isWebcamOn, startWebcam, stopWebcam } = useWebcam();
  const { recording, recordedChunks, startRecording, stopRecording, mediaRecorderRef } = useRecording(streamRef);
  const { uploading, publicUrl, uploadVideo } = useVideoUpload();

  const handleUploadVideo = async () => {
    if (mediaRecorderRef.current) {
      await uploadVideo(recordedChunks, mediaRecorderRef.current.mimeType);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-gray-800">
      <VideoPreview videoRef={videoRef} />
      <VideoControls
        isWebcamOn={isWebcamOn}
        recording={recording}
        recordedChunks={recordedChunks}
        uploading={uploading}
        publicUrl={publicUrl}
        onStartWebcam={startWebcam}
        onStopWebcam={stopWebcam}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onUploadVideo={handleUploadVideo}
        onNarrate={onNarrate}
      />
      <UploadStatus publicUrl={publicUrl} />
    </div>
  );
};

export default VideoRecorder;
