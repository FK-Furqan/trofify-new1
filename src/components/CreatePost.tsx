import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { X, Upload, Image as ImageIcon, Video, Smile, MapPin, UserTag } from "lucide-react";
import { toast } from "sonner";

// Helper function to get backend URL
const getBackendUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? 'https://your-production-backend.com' 
    : 'http://localhost:5000';
};

export const CreatePost = ({ user, onPostCreated, open: controlledOpen, onOpenChange }) => {
  console.log('CreatePost rendered with props:', { user: !!user, open: controlledOpen, onOpenChange: !!onOpenChange });
  
  if (!user) {
    console.log('CreatePost: No user provided, returning null');
    return null;
  }

  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid image or video file");
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && !selectedFile) {
      toast.error("Please add some content or upload an image/video");
      return;
    }

    setUploading(true);
    
    try {
      let mediaUrl = null;
      let mediaType = null;

      // Upload media file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('user_id', user.id);

        const uploadResponse = await fetch(`${getBackendUrl()}/api/upload/post-media`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload media');
        }

        const uploadData = await uploadResponse.json();
        mediaUrl = uploadData.url;
        mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
      }

      // Create post record
      const postData = {
        user_id: user.id,
        description: content.trim(),
        media_url: mediaUrl,
        media_type: mediaType
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
      removeFile();
      
      // Close modal
      onOpenChange(false);
      
      // Notify parent component
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

  const getFileType = () => {
    if (!selectedFile) return null;
    return selectedFile.type.startsWith('video/') ? 'video' : 'image';
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

          {/* File Preview */}
          {preview && (
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
                      alt="Preview" 
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
                <div className="mt-2">
                  <Badge variant="secondary">
                    {getFileType() === 'video' ? (
                      <>
                        <Video className="h-3 w-3 mr-1" />
                        Video
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Image
                      </>
                    )}
                  </Badge>
                </div>
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
                className="text-blue-600 hover:text-blue-700"
              >
                <Upload className="h-4 w-4 mr-1" />
                Media
              </Button>
              
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
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
                disabled={uploading || (!content.trim() && !selectedFile)}
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
