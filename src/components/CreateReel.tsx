import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Play, Pause, Volume2, VolumeX, Hash, MapPin, Music, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getBackendUrl } from '@/lib/utils';

interface CreateReelProps {
  onClose: () => void;
  onReelCreated?: (reel: any) => void;
  userId: string;
}

export const CreateReel: React.FC<CreateReelProps> = ({ onClose, onReelCreated, userId }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [audioAttribution, setAudioAttribution] = useState('');
  const [location, setLocation] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload MP4, MOV, AVI, or QuickTime files.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Video file must be less than 100MB.",
        variant: "destructive"
      });
      return;
    }

    setVideoFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);

    // Load video metadata
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      setDuration(video.duration);
      
      // Check if video is longer than 20 seconds
      if (video.duration > 20) {
        toast({
          title: "Video too long",
          description: "Reels must be 20 seconds or shorter. Please trim your video.",
          variant: "destructive"
        });
        setVideoFile(null);
        setVideoPreview(null);
        URL.revokeObjectURL(previewUrl);
      }
    };
    video.src = previewUrl;
  }, [toast]);

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleUpload = async () => {
    if (!videoFile) {
      toast({
        title: "No video selected",
        description: "Please select a video file to upload.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('userId', userId);
      formData.append('caption', caption);
      formData.append('hashtags', hashtags);
      formData.append('audioAttribution', audioAttribution);
      formData.append('location', location);

      const response = await fetch(`${getBackendUrl()}/api/reels/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const reel = await response.json();
      
      toast({
        title: "Reel uploaded successfully!",
        description: "Your reel is now live.",
      });

      if (onReelCreated) {
        onReelCreated(reel);
      }
      
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload reel",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        const event = { target: { files: [file] } } as any;
        handleFileSelect(event);
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold">Create Reel</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* Video Upload Area */}
            {!videoPreview ? (
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">Upload your video</p>
                <p className="text-sm text-gray-500 mb-4">
                  Drag and drop or click to select a video file
                </p>
                <p className="text-xs text-gray-400">
                  MP4, MOV, AVI, or QuickTime • Max 100MB • Max 20 seconds
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Video Preview */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-h-96">
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    className="w-full h-full object-cover"
                    onTimeUpdate={handleVideoTimeUpdate}
                    onEnded={handleVideoEnded}
                    muted={isMuted}
                  />
                  
                  {/* Video Controls Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={handleVideoPlay}
                      className="bg-black/20 hover:bg-black/40 text-white"
                    >
                      {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </Button>
                  </div>

                  {/* Mute/Unmute Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMuteToggle}
                    className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/20 p-2">
                    <div className="flex items-center justify-between text-white text-xs mb-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1">
                      <div
                        className="bg-white h-1 rounded-full transition-all"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            )}

            {/* Form Fields */}
            {videoPreview && (
              <div className="space-y-4">
                {/* Caption */}
                <div>
                  <label className="block text-sm font-medium mb-2">Caption</label>
                  <Textarea
                    placeholder="Write a caption for your reel..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">{caption.length}/500</p>
                </div>

                {/* Hashtags */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Hashtags
                  </label>
                  <Input
                    placeholder="sports, fitness, motivation (comma separated)"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate hashtags with commas
                  </p>
                </div>

                {/* Audio Attribution */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Audio Attribution
                  </label>
                  <Input
                    placeholder="Original audio by @username"
                    value={audioAttribution}
                    onChange={(e) => setAudioAttribution(e.target.value)}
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </label>
                  <Input
                    placeholder="Add location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || !videoFile}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Uploading...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Post Reel
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 