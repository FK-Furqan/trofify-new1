import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { X, Upload, Image as ImageIcon, Video, Smile, MapPin, Camera } from "lucide-react";
import { toast } from "sonner";
import { getBackendUrl } from "@/lib/utils";

export const CreatePost = ({ user, onPostCreated, open: controlledOpen, onOpenChange }) => {
  console.log('CreatePost rendered with props:', { user: !!user, open: controlledOpen, onOpenChange: !!onOpenChange });
  
  if (!user) {
    console.log('CreatePost: No user provided, returning null');
    return null;
  }

  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
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
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        toast.error(`Unsupported file type: ${file.type}. Please select a valid image or video file.`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) { // Increased to 50MB for videos
        toast.error("File size must be less than 50MB");
        continue;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (idx: number) => {
    if (previews[idx]) {
      URL.revokeObjectURL(previews[idx]);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && selectedFiles.length === 0) {
      toast.error("Please add some content or upload images");
      return;
    }
    setUploading(true);
    try {
      let imageUrls: string[] = [];
      // Upload all images if selected
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', user.id);
        const uploadResponse = await fetch(`${getBackendUrl()}/api/upload/post-media`, {
          method: 'POST',
          body: formData,
        });
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload media');
        }
        const uploadData = await uploadResponse.json();
        imageUrls.push(uploadData.url);
      }
      // Create post record
      const postData = {
        user_id: user.id,
        description: content.trim(),
        images: imageUrls,
      };
      const createResponse = await fetch(`${getBackendUrl()}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      if (!createResponse.ok) {
        throw new Error('Failed to create post');
      }
      const newPost = await createResponse.json();
      // Reset form
      setContent("");
      previews.forEach((url) => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviews([]);
      onOpenChange(false);
      if (onPostCreated) {
        onPostCreated(newPost);
      }
      toast.success("Post created successfully!");
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={controlledOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Share what's on your mind with TrofiFy community
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
              <p className="text-xs text-muted-foreground">Posting to timeline</p>
            </div>
          </div>
          {/* Content Input */}
          <Textarea
            placeholder="What's happening in your sports world?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none border-none focus:ring-0 text-lg placeholder:text-muted-foreground"
            disabled={uploading}
          />
          {/* File Previews */}
          {previews.length > 0 && (
            <Card className="relative">
              <CardContent className="p-2 flex gap-2 overflow-x-auto">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative w-32 h-32 flex-shrink-0">
                    <img 
                      src={preview} 
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-contain rounded-lg border"
                    />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                      onClick={() => removeFile(idx)}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                ))}
              </CardContent>
            </Card>
          )}
          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-[#0e9591] hover:text-[#087a74]"
              >
                <Upload className="h-4 w-4 mr-1" />
                Media
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCameraClick}
                disabled={uploading}
                className="text-[#0e9591] hover:text-[#087a74]"
              >
                <Camera className="h-4 w-4 mr-1" />
                Camera
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.heic,.heif,.bmp,.tiff,.svg"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <Input
                ref={cameraInputRef}
                type="file"
                accept="image/*,video/*,.heic,.heif,.bmp,.tiff,.svg"
                capture="environment"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
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
                disabled={uploading || (!content.trim() && selectedFiles.length === 0)}
                className="bg-[#0e9591] hover:bg-[#0c7b77] text-white"
              >
                {uploading ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
