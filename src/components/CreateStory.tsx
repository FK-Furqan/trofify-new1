import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { X, Upload, Image as ImageIcon, Video, Camera } from "lucide-react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/utils";

export const CreateStory = ({ user, onStoryCreated, open, onOpenChange }) => {
  console.log('CreateStory rendered with props:', { user: !!user, open: open, onOpenChange: !!onOpenChange });
  
  if (!user) {
    console.log('CreateStory: No user provided, returning null');
    return null;
  }

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window['opera'];
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isMobileViewport = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isMobileViewport);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCameraClick = () => {
    if (isMobile) {
      // On mobile, open camera directly
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    } else {
      // On desktop, show a message that camera is mobile-only
      toast.info("Camera capture is only available on mobile devices");
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        // Images
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'image/gif', 
        'image/webp', 
        'image/heic', 
        'image/heif',
        'image/bmp',
        'image/tiff',
        'image/svg+xml',
        // Videos
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
        'video/x-flv',
        'video/3gpp',
        'video/3gpp2'
      ];
      if (!validTypes.includes(file.type)) {
        toast.error(`Unsupported file type: ${file.type}. Please select a valid image or video file.`);
        return;
      }

      // Validate file size (50MB limit for videos)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  };

  const removeFile = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error("Please select an image or video for your story");
      return;
    }

    setUploading(true);
    
    try {
      // Upload media file
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('user_id', user.id);

      const uploadResponse = await fetch(`${getBackendUrl()}/api/upload/story-media`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload media');
      }

      const uploadData = await uploadResponse.json();

      // Create story record
      const storyData = {
        user_id: user.id,
        media_url: uploadData.url
      };

      const createResponse = await fetch(`${getBackendUrl()}/api/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create story');
      }

      const newStory = await createResponse.json();

      // Reset form
      removeFile();
      
      // Close modal
      onOpenChange(false);
      
      // Notify parent component
      if (onStoryCreated) {
        onStoryCreated(newStory);
      }
      
      toast.success("Story created successfully!");

    } catch (error) {
      console.error('Error creating story:', error);
      toast.error("Failed to create story. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getFileType = () => {
    if (!selectedFile) return null;
    return selectedFile.type.startsWith('video/') ? 'video' : 'image';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
          <DialogDescription>
            Share a moment with your TrofiFy community (visible for 24 hours)
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar || '/placeholder.svg'} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{user.display_name || user.email}</p>
              <p className="text-xs text-muted-foreground">Creating story</p>
            </div>
          </div>

          {/* File Selection or Preview */}
          {!preview ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <div className="flex flex-col items-center space-y-2">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                    <p className="text-sm text-gray-600">Choose a photo or video for your story</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Gallery
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCameraClick}
                      disabled={uploading}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Camera
                    </Button>
                  </div>
                </div>
              </div>
              
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.heic,.heif,.bmp,.tiff,.svg"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              
              <Input
                ref={cameraInputRef}
                type="file"
                accept="image/*,video/*,.heic,.heif,.bmp,.tiff,.svg"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </div>
          ) : (
            <Card className="relative">
              <CardContent className="p-2">
                <div className="relative">
                  {getFileType() === 'video' ? (
                    <video 
                      src={preview} 
                      className="w-full rounded-lg max-h-80 object-cover"
                      controls
                    />
                  ) : (
                    <img 
                      src={preview} 
                      alt="Story preview" 
                      className="w-full rounded-lg max-h-80 object-cover"
                    />
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeFile}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <Badge variant="secondary">
                    {getFileType() === 'video' ? (
                      <>
                        <Video className="h-3 w-3 mr-1" />
                        Video Story
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Photo Story
                      </>
                    )}
                  </Badge>
                  <p className="text-xs text-muted-foreground">Expires in 24 hours</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="text-xs text-muted-foreground">
              Stories are visible to your followers for 24 hours
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={uploading || !selectedFile}
                className="bg-[#0e9591] hover:bg-[#0c7b77] text-white"
              >
                {uploading ? "Sharing..." : "Share Story"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 