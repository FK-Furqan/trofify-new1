import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Progress } from './ui/progress';
import { X, Play, Pause, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface VideoTrimmerProps {
  file: File;
  onTrimmed: (trimmedFile: File) => void;
  onCancel: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
  file,
  onTrimmed,
  onCancel,
  open,
  onOpenChange
}) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(20);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimProgress, setTrimProgress] = useState(0);
  const [error, setError] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const MAX_DURATION = 20; // 20 seconds

  // Load video and get metadata
  useEffect(() => {
    if (file && open) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);

      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        const duration = video.duration;
        setVideoMetadata({
          duration,
          width: video.videoWidth,
          height: video.videoHeight
        });

        // Set initial trim range
        if (duration > MAX_DURATION) {
          setTrimStart(0);
          setTrimEnd(MAX_DURATION);
        } else {
          setTrimStart(0);
          setTrimEnd(duration);
        }
      };

      video.onerror = () => {
        setError('Failed to load video. Please try a different file.');
      };

      video.src = url;

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file, open]);

  // Handle video playback
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [videoUrl]);

  // Update video time when trim range changes
  useEffect(() => {
    if (videoRef.current && currentTime < trimStart) {
      videoRef.current.currentTime = trimStart;
    }
  }, [trimStart, currentTime]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const seekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(trimStart, Math.min(trimEnd, time));
    }
  };

  const handleSliderChange = (value: number[]) => {
    const [start, end] = value;
    setTrimStart(start);
    setTrimEnd(end);
    
    // Update video time if it's outside the new range
    if (videoRef.current && (currentTime < start || currentTime > end)) {
      videoRef.current.currentTime = start;
    }
  };

  const resetTrim = () => {
    if (videoMetadata) {
      if (videoMetadata.duration > MAX_DURATION) {
        setTrimStart(0);
        setTrimEnd(MAX_DURATION);
      } else {
        setTrimStart(0);
        setTrimEnd(videoMetadata.duration);
      }
    }
  };

  const trimVideo = async () => {
    if (!videoMetadata || !videoRef.current || !canvasRef.current) return;

    setIsTrimming(true);
    setTrimProgress(0);
    setError('');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const duration = trimEnd - trimStart;
      const fps = 30; // Assume 30fps for simplicity
      const totalFrames = Math.floor(duration * fps);
      const chunks: Blob[] = [];
      
      // Check MediaRecorder support
      if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        // Fallback: just return the original file with a warning
        toast.warning('Video trimming not supported in this browser. Using original video.');
        onTrimmed(file);
        onOpenChange(false);
        setIsTrimming(false);
        return;
      }

      const mediaRecorder = new MediaRecorder(canvas.captureStream(fps), {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: 'video/webm' });
          
          // Create trimmed file
          const trimmedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '_trimmed.webm'), {
            type: 'video/webm'
          });

          toast.success('Video trimmed successfully!');
          onTrimmed(trimmedFile);
          onOpenChange(false);
        } catch (err) {
          console.error('Error creating trimmed file:', err);
          setError('Failed to create trimmed video. Please try again.');
          toast.error('Failed to trim video. Please try again.');
        } finally {
          setIsTrimming(false);
          setTrimProgress(0);
        }
      };

      // Start recording
      mediaRecorder.start();
      
      // Seek to start time and wait for it to load
      video.currentTime = trimStart;
      
      let frameCount = 0;
      const recordFrame = () => {
        if (frameCount >= totalFrames || video.currentTime >= trimEnd) {
          mediaRecorder.stop();
          return;
        }

        // Draw current frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        frameCount++;
        setTrimProgress((frameCount / totalFrames) * 100);

        // Request next frame
        requestAnimationFrame(recordFrame);
      };

      // Wait for video to be ready at the start time
      const waitForVideo = () => {
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA
          recordFrame();
        } else {
          setTimeout(waitForVideo, 100);
        }
      };

      video.oncanplay = waitForVideo;

    } catch (err) {
      console.error('Error trimming video:', err);
      setError('Failed to trim video. Please try again.');
      toast.error('Failed to trim video. Please try again.');
      setIsTrimming(false);
      setTrimProgress(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoMetadata) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Loading Video...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0e9591]"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const needsTrimming = videoMetadata.duration > MAX_DURATION;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {needsTrimming ? (
              <>
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Video Too Long - Select 20 Seconds
              </>
            ) : (
              'Video Preview'
            )}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Hidden Canvas for Video Processing */}
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          
          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-auto max-h-[400px] object-contain"
              muted
              playsInline
            />
            
            {/* Play/Pause Overlay */}
            <button
              onClick={togglePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-12 w-12 text-white" />
              ) : (
                <Play className="h-12 w-12 text-white ml-1" />
              )}
            </button>

            {/* Current Time Display */}
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
              {formatTime(currentTime)}
            </div>
          </div>

          {/* Video Info */}
          <div className="text-sm text-muted-foreground">
            <p>Duration: {formatTime(videoMetadata.duration)}</p>
            <p>Resolution: {videoMetadata.width} × {videoMetadata.height}</p>
            {needsTrimming && (
              <p className="text-orange-600 font-medium">
                Video exceeds 20 seconds. Please select a 20-second segment.
              </p>
            )}
          </div>

          {/* Trimming Controls */}
          {needsTrimming && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Trim Range: {formatTime(trimStart)} - {formatTime(trimEnd)}</span>
                  <span className="text-muted-foreground">
                    Duration: {formatTime(trimEnd - trimStart)}
                  </span>
                </div>
                
                <Slider
                  value={[trimStart, trimEnd]}
                  onValueChange={handleSliderChange}
                  max={videoMetadata.duration}
                  min={0}
                  step={0.1}
                  className="w-full"
                  disabled={isTrimming}
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0:00</span>
                  <span>{formatTime(videoMetadata.duration)}</span>
                </div>
              </div>

              {/* Trim Progress */}
              {isTrimming && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Trimming video...</span>
                    <span>{trimProgress}%</span>
                  </div>
                  <Progress value={trimProgress} className="w-full" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={resetTrim}
                  variant="outline"
                  size="sm"
                  disabled={isTrimming}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                
                              <Button
                onClick={trimVideo}
                disabled={isTrimming}
                className="flex-1"
              >
                  {isTrimming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Trimming...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Trim & Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons for videos that don't need trimming */}
          {!needsTrimming && (
            <div className="flex gap-2">
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => onTrimmed(file)}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Use Video
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 