import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Camera, Upload, RotateCcw, ZoomIn, ZoomOut, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getBackendUrl, handleProfileImageUpdate } from '@/lib/utils';
import axios from 'axios';

interface ProfilePhotoUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  refreshUserProfile?: () => void;
  onImageUploaded?: (imageUrl: string) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  open,
  onOpenChange,
  userId,
  refreshUserProfile,
  onImageUploaded
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile device
  React.useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any)['opera'];
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isMobileViewport = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isMobileViewport);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp', 
      'image/heic', 
      'image/heif',
      'image/bmp',
      'image/tiff'
    ];

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file (JPEG, PNG, GIF, WebP, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraClick = () => {
    if (isMobile) {
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    } else {
      toast({
        title: "Camera not available",
        description: "Camera capture is only available on mobile devices",
      });
    }
  };

  const onCropComplete = useCallback((croppedArea: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async (): Promise<Blob> => {
    if (!imageSrc || !croppedAreaPixels) {
      throw new Error('No image or crop area available');
    }

    const image = new Image();
    image.src = imageSrc;

    return new Promise((resolve, reject) => {
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size to the cropped area
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        // Apply rotation
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        // Draw the cropped image
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        ctx.restore();

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          0.9 // High quality
        );
      };

      image.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    });
  };

  const handleSave = async () => {
    if (!selectedFile || !croppedAreaPixels) {
      toast({
        title: "Error",
        description: "Please select an image and crop it first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Create cropped image
      const croppedBlob = await createCroppedImage();
      
      // Convert blob to file
      const croppedFile = new File([croppedBlob], selectedFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Upload to server
      const formData = new FormData();
      formData.append('file', croppedFile);
      formData.append('userId', userId);

      const response = await axios.post(`${getBackendUrl()}/api/upload-profile-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newImageUrl = response.data.imageUrl;

      // Update profile
      handleProfileImageUpdate(userId, newImageUrl, refreshUserProfile);

      // Call callback if provided
      if (onImageUploaded) {
        onImageUploaded(newImageUrl);
      }

      // Close modal and reset state
      handleClose();
      
      toast({
        title: "Success",
        description: "Profile photo updated successfully!",
      });

    } catch (error) {
      console.error('Error uploading profile photo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setSelectedFile(null);
    setImageSrc('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    
    // Clear file inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    
    onOpenChange(false);
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            Update Profile Photo
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!imageSrc ? (
            // File selection view
            <div className="p-6 space-y-4">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Choose a photo</h3>
                  <p className="text-sm text-muted-foreground">
                    Select an image from your device or take a new photo
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose from Library
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCameraClick}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            // Cropping view
            <div className="relative h-[400px] sm:h-[500px]">
              <div className="absolute inset-0">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  showGrid={true}
                  objectFit="contain"
                  style={{
                    containerStyle: {
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#000',
                    },
                    cropAreaStyle: {
                      border: '2px solid #fff',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                    },
                    mediaStyle: {
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    },
                  }}
                />
              </div>

              {/* Controls overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4">
                <div className="space-y-4">
                  {/* Zoom control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-white text-sm">
                      <span>Zoom</span>
                      <span>{Math.round(zoom * 100)}%</span>
                    </div>
                    <Slider
                      value={[zoom]}
                      onValueChange={(value) => setZoom(value[0])}
                      min={1}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Rotation control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-white text-sm">
                      <span>Rotation</span>
                      <span>{rotation}°</span>
                    </div>
                    <Slider
                      value={[rotation]}
                      onValueChange={(value) => setRotation(value[0])}
                      min={-180}
                      max={180}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetCrop}
                      className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          {imageSrc ? (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={uploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={uploading || !croppedAreaPixels}
                className="flex-1"
              >
                {uploading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 