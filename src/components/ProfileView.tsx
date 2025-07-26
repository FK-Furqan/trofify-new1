import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Trophy,
  Star,
  Users,
  Heart,
  MessageSquare,
  Settings,
  Camera,
  Edit3,
  ArrowLeft,
  Trash2,
  MoreVertical,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PostActions } from "./PostActions";
import { PostCard } from "./PostCard";
import { PostModal } from "./PostModal";
import { getBackendUrl } from "@/lib/utils";
const defaultAvatar = "/placeholder.svg"; // Use direct public path

interface ProfileViewProps {
  profile?: any;
  onBack?: () => void;
  loggedInUserId?: string;
  refreshUserProfile?: () => void; // Add this prop
  onProfileClick?: (profile: any) => void;
  onSaveChange?: () => void; // Add callback for save changes
  onNavigateToMessages?: () => void; // Add callback for messages navigation
}

export const ProfileView = ({ profile, onBack, loggedInUserId, refreshUserProfile, onProfileClick, onSaveChange, onNavigateToMessages }: ProfileViewProps) => {
  // Debug log for troubleshooting profile ownership
  console.log("ProfileView props:", { 
    profile, 
    loggedInUserId, 
    profileId: profile?.id,
    profileEmail: profile?.email,
    isOwnProfile: profile && loggedInUserId && (profile.id === loggedInUserId || profile.email === loggedInUserId) 
  });
  
  const [activeTab, setActiveTab] = useState("posts");
  const [editOpen, setEditOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(profile?.avatar || "");
  const [imageLoadError, setImageLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const fileInputRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");
  // Add state for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [navigatingBack, setNavigatingBack] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Format time ago helper function
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHours < 1) {
      return diffMins <= 1 ? "Just now" : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      // Show date in format: May 20, 2024
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  // Helper to get the correct avatar URL
  const getAvatarUrl = (avatar?: string) => {
    console.log("getAvatarUrl called with:", avatar);
    if (!avatar) {
      console.log("No avatar, returning placeholder");
      return "/placeholder.svg";
    }
    if (avatar.startsWith("http")) {
      console.log("Avatar is already a full URL:", avatar);
      return avatar;
    }
    if (avatar.startsWith("/")) {
      console.log("Avatar is a relative path:", avatar);
      return avatar;
    }
    const fullUrl = `https://trofify-media.s3.amazonaws.com/${avatar}`;
    console.log("Constructed full URL:", fullUrl);
    return fullUrl;
  };

  // Guard: If profile is not loaded, show loading spinner
  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-[#0e9591]" />
      </div>
    );
  }

  // Fetch posts for this profile
  useEffect(() => {
    const fetchPosts = async () => {
      console.log("Fetching posts for profile:", profile);
      if (!profile?.id) {
        console.log("No profile ID found, cannot fetch posts");
        return;
      }
      setPostsLoading(true);
      setPostsError("");
      try {
        // Convert ID to string to ensure consistency
        const profileId = profile.id.toString();
        console.log("Making request to:", `${getBackendUrl()}/api/posts/user/${profileId}`);
        const res = await fetch(`${getBackendUrl()}/api/posts/user/${profileId}?current_user_id=${loggedInUserId}`);
        console.log("Response status:", res.status);
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Response error:", errorText);
          throw new Error(`Failed to fetch posts: ${res.status} ${errorText}`);
        }
        const data = await res.json();
        console.log("Posts data:", data);
        setPosts(data);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setPostsError("Failed to load posts");
      } finally {
        setPostsLoading(false);
      }
    };
    fetchPosts();
  }, [profile?.id]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768); // Increased from 640 to 768
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper to initialize editForm with all possible fields from profile
  const getInitialEditForm = (profile: any) => ({
    full_name: profile?.full_name || "",
    email: profile?.email || "",
    phone_number: profile?.phone_number || "",
    sport: profile?.sport || "",
    level: profile?.level || "",
    achievements: profile?.achievements || "",
    date_of_birth: profile?.date_of_birth || "",
    location: profile?.location || "",
    experience: profile?.experience || "",
    certifications: profile?.certifications || "",
    specialization: profile?.specialization || "",
    organization: profile?.organization || "",
    favorite_sports: profile?.favorite_sports || "",
    favorite_teams: profile?.favorite_teams || "",
    interests: profile?.interests || "",
    venue_name: profile?.venue_name || "",
    venue_type: profile?.venue_type || "",
    address: profile?.address || "",
    city: profile?.city || "",
    state: profile?.state || "",
    zip_code: profile?.zip_code || "",
    website: profile?.website || "",
    facilities: profile?.facilities || "",
    capacity: profile?.capacity || "",
    description: profile?.description || "",
    owner_name: profile?.owner_name || "",
    contact_name: profile?.contact_name || "",
    brand_name: profile?.brand_name || "",
    company_type: profile?.company_type || "",
    product_categories: profile?.product_categories || "",
    target_markets: profile?.target_markets || "",
  });

  const [editForm, setEditForm] = useState(getInitialEditForm(profile));

  // Update editForm when profile changes (e.g., after save or profile switch)
  useEffect(() => {
    setEditForm(getInitialEditForm(profile));
  }, [profile]);

  useEffect(() => {
    setProfileImage(profile?.avatar || "");
    setImageLoadError(false);
    setRetryCount(0);
    console.log("Profile avatar updated:", profile?.avatar);
  }, [profile?.avatar]); // Watch for changes in avatar specifically

  // Helper to re-fetch profile if image fails to load
  const refetchProfile = async () => {
    if (!profile?.email) {
      console.log("No email available for profile refetch");
      return;
    }
    console.log("Refetching profile for email:", profile.email);
    try {
      const res = await fetch(`${getBackendUrl()}/signup/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Profile refetch successful:", data);
        setProfileImage(data.avatar || "");
        setImageLoadError(false);
        setRetryCount((c) => c + 1);
      } else {
        console.log("Profile refetch failed with status:", res.status);
        setImageLoadError(true);
      }
    } catch (error) {
      console.log("Profile refetch error:", error);
      setImageLoadError(true);
    }
  };

  const handleEditChange = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send update to backend
    setEditOpen(false);
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", profile.id);
    try {
      const res = await axios.post(`${getBackendUrl()}/api/upload-profile-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfileImage(res.data.imageUrl);
      console.log("Profile image uploaded successfully:", res.data.imageUrl);
      if (refreshUserProfile) {
        refreshUserProfile(); // Refresh global profile after upload
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert("Failed to upload image");
    }
  };

  // Add navigation handler with loading state
  const handleBackNavigation = async () => {
    setNavigatingBack(true);
    try {
      // Small delay to show spinner
      await new Promise(resolve => setTimeout(resolve, 500));
      if (onBack) {
        onBack();
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setNavigatingBack(false);
    }
  };

  // Add message navigation handler
  const handleMessageClick = () => {
    if (onNavigateToMessages && normalizedProfile?.id) {
      onNavigateToMessages(normalizedProfile.id);
    }
  };

  // Add delete handler
  const handleDeletePost = async (postId: string) => {
    if (!loggedInUserId) return;
    setDeleteDialogOpen(false);
    setPostToDelete(null);
    try {
      setPostsLoading(true);
      const res = await fetch(`${getBackendUrl()}/api/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      if (!res.ok) throw new Error("Failed to delete post");
      setPosts((prev) => prev.filter((p: any) => p.id !== postId));
    } catch (err) {
      alert("Failed to delete post");
    } finally {
      setPostsLoading(false);
    }
  };

  const handlePostClick = (post: any) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  // Remove defaultProfile and any fallback to it
  // Replace: const currentProfile = profile || defaultProfile;
  const currentProfile = profile;
  
  // Debug logging for profile data
  console.log("ProfileView - Current Profile:", currentProfile);
  
  // Get the best available name for display
  const getDisplayName = (profile: any) => {
    return profile?.display_name || 
           profile?.full_name || 
           profile?.name || 
           profile?.email?.split('@')[0] || 
           "Unknown";
  };

  // Normalize profile data to ensure consistent structure
  const normalizeProfile = (profile: any) => {
    if (!profile) return null;
    
    console.log("Normalizing profile data:", profile);
    
    return {
      id: profile.id,
      email: profile.email,
      display_name: profile.display_name || profile.name || profile.email?.split('@')[0] || "Unknown",
      full_name: profile.full_name || profile.name || profile.display_name,
      name: profile.name || profile.display_name || profile.full_name,
      avatar: profile.avatar,
      user_type: profile.user_type || profile.sport || "athlete",
      sport: profile.sport || profile.user_type || "athlete",
      // Add any other fields that might be needed
      ...profile
    };
  };

  // Use normalized profile data
  const normalizedProfile = normalizeProfile(currentProfile);
  
  // Debug logging for normalized profile data
  console.log("ProfileView - Normalized Profile:", normalizedProfile);
  console.log("ProfileView - Profile Avatar:", normalizedProfile?.avatar);
  console.log("ProfileView - Profile Name:", normalizedProfile?.name);
  console.log("ProfileView - Profile Display Name:", normalizedProfile?.display_name);
  console.log("ProfileView - Profile Full Name:", normalizedProfile?.full_name);
  console.log("ProfileView - Profile Email:", normalizedProfile?.email);
  console.log("ProfileView - Profile ID:", normalizedProfile?.id);
  console.log("ProfileView - Profile User Type:", normalizedProfile?.user_type);
  console.log("ProfileView - Profile Sport:", normalizedProfile?.sport);
  
  // State to store complete profile data
  const [completeProfileData, setCompleteProfileData] = useState<any>(null);
  
  // If profile doesn't have avatar, fetch complete profile data from backend
  useEffect(() => {
    const fetchCompleteProfile = async () => {
      if (normalizedProfile?.id && !normalizedProfile?.avatar && !completeProfileData) {
        console.log("ProfileView: Fetching complete profile data for ID:", normalizedProfile.id);
        try {
          const response = await fetch(`${getBackendUrl()}/api/users/${normalizedProfile.id}`);
          if (response.ok) {
            const completeProfile = await response.json();
            console.log("ProfileView: Complete profile data fetched:", completeProfile);
            setCompleteProfileData(completeProfile);
          } else {
            console.error("ProfileView: Failed to fetch profile, status:", response.status);
          }
        } catch (error) {
          console.error("ProfileView: Error fetching complete profile:", error);
        }
      }
    };
    
    fetchCompleteProfile();
  }, [normalizedProfile?.id, normalizedProfile?.avatar, completeProfileData]);
  
  // Use complete profile data if available, otherwise use normalized profile
  const finalProfile = completeProfileData || normalizedProfile;
  
  // Improved isOwnProfile logic with better handling of data structures
  const isOwnProfile = finalProfile && loggedInUserId && (
    finalProfile.id === loggedInUserId || 
    finalProfile.email === loggedInUserId ||
    finalProfile.id?.toString() === loggedInUserId?.toString() ||
    finalProfile.email?.toString() === loggedInUserId?.toString()
  );
  
  // Additional debug logging for mobile view
  console.log("Mobile view debug:", { 
    isMobile, 
    isOwnProfile, 
    windowWidth: window.innerWidth,
    hasProfile: !!profile,
    hasLoggedInUserId: !!loggedInUserId
  });

  // Add spinner CSS in a <style> tag at the top of the file (or move to App.css if preferred)
  const Spinner = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 40 }}>
      <div className="profile-spinner" />
      <style>{`
        .profile-spinner {
          border: 4px solid #e0f7f6;
          border-top: 4px solid #0e9591;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (isMobile) {
    // MOBILE LAYOUT
    // Assume header is 56px tall (top-14)
    return (
      <>
        {/* Back Arrow - removed from header, will be positioned on image */}
        {/* Fixed Photo at Top, offset for header */}
        <div
          className="fixed left-0 w-full"
          style={{ top: 56, height: 'calc(60vh - 56px)', zIndex: 10 }}
        >
          <img
            src={imageLoadError ? defaultAvatar : getAvatarUrl(profileImage || finalProfile?.avatar)}
            alt="Profile"
            className="object-cover w-full h-full"
            onError={() => {
              console.log("Profile image failed to load:", profileImage || normalizedProfile?.avatar);
              if (!imageLoadError && retryCount < 1) {
                console.log("Retrying profile fetch...");
                refetchProfile();
              } else {
                console.log("Setting image load error to true");
                setImageLoadError(true);
              }
            }}
            onLoad={() => {
              console.log("Profile image loaded successfully:", profileImage || normalizedProfile?.avatar);
              setImageLoadError(false);
            }}
          />
          {/* Back Button - Left side */}
          <button
            onClick={handleBackNavigation}
            disabled={navigatingBack}
            className="absolute top-1 left-4 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg z-30 border-2 border-[#0e9591] hover:bg-[#0e9591] transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Go back"
          >
            {navigatingBack ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowLeft className="h-4 w-4 text-[#0e9591] group-hover:text-white transition-colors duration-200" />
            )}
          </button>
          
          {/* Camera Button - Right side (only for own profile) */}
          {isOwnProfile && (
            <button
              className="absolute top-1 right-4 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg z-30 border-2 border-[#0e9591] hover:bg-[#0e9591] transition-all duration-200 group"
              onClick={() => setShowImageDialog(true)}
              aria-label="Change profile image"
            >
              <Camera className="h-4 w-4 text-[#0e9591] group-hover:text-white transition-colors duration-200" />
            </button>
          )}
          {/* Camera/Gallery Dialog */}
          <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
            <DialogContent className="max-w-xs w-full p-4 text-center">
              <DialogHeader>
                <DialogTitle>Change Profile Image</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-2">
                <button
                  className="bg-[#0e9591] text-white py-2 rounded-lg font-semibold"
                  onClick={() => {
                    setShowImageDialog(false);
                    setTimeout(() => cameraInputRef.current?.click(), 200);
                  }}
                  disabled={uploading}
                >
                  Open Camera
                </button>
                <button
                  className="bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
                  onClick={() => {
                    setShowImageDialog(false);
                    setTimeout(() => galleryInputRef.current?.click(), 200);
                  }}
                  disabled={uploading}
                >
                  Open Gallery
                </button>
                {uploading && <Spinner />}
              </div>
            </DialogContent>
          </Dialog>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            style={{ display: 'none' }}
            onChange={async (e) => {
              setUploading(true);
              await handleFileChange(e);
              setUploading(false);
            }}
          />
          <input
            type="file"
            accept="image/*"
            ref={galleryInputRef}
            style={{ display: 'none' }}
            onChange={async (e) => {
              setUploading(true);
              await handleFileChange(e);
              setUploading(false);
            }}
          />
        </div>
        {/* Scrollable Content */}
        <div
          className="relative z-20"
          style={{ marginTop: 'calc(52vh - 28px)' }}
        >
          {/* Overlapping White Info Card */}
          <div className="bg-card rounded-t-3xl shadow-lg p-4 -mt-12">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold flex items-center text-foreground">
                {getDisplayName(finalProfile)}
              </h1>
              <span className="bg-[#0e9591] text-white px-3 py-1 rounded-full text-xs font-semibold">
                {(finalProfile?.sport || finalProfile?.user_type || "User").toUpperCase()}
              </span>
            </div>
            <div className="mb-2 text-muted-foreground text-sm">
              {currentProfile.bio || currentProfile.description || "No bio available."}
            </div>
            <div className="mt-4 flex gap-2">
              {isOwnProfile ? (
                <button className="flex-1 bg-muted text-foreground py-2 rounded-lg font-semibold">Add Story</button>
              ) : (
                <>
                  <button className="flex-1 bg-[#0e9591] text-white py-2 rounded-lg font-semibold">Support</button>
                  <button 
                    onClick={handleMessageClick}
                    className="flex-1 bg-muted text-foreground py-2 rounded-lg font-semibold hover:bg-muted/80 transition-colors"
                  >
                    Message
                  </button>
                </>
              )}
            </div>
          </div>
          {/* Sticky Tabs */}
          <div className="sticky top-0 z-30 bg-card border-b-2 border-border">
            <div className="flex space-x-8 px-4">
              {['posts', 'photos', 'videos', 'about'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-[#0e9591] text-[#0e9591]'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Content */}
          {activeTab === 'posts' && (
            <div className="space-y-2">
              {postsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0e9591]"></div>
                    <p className="text-foreground font-medium">Loading posts...</p>
                  </div>
                </div>
              ) : postsError ? (
                <div className="text-red-500 text-center p-4">{postsError}</div>
              ) : posts.length === 0 ? (
                <div className="text-muted-foreground text-center p-4">No posts yet.</div>
              ) : (
                <div className="space-y-0">
                  {(posts || []).filter(Boolean).map((post) => {
                    // Defensive: fallback for missing/undefined post fields
                    const safeDescription = post?.description || "";
                    const safeMediaUrl = (post?.images && post.images.length > 0) ? post.images[0] : (post?.media_url || "");
                    const safeId = post?.id || Math.random().toString(36).substr(2, 9);
                    // Defensive: fallback for author fields
                    const safeAuthorName = finalProfile?.display_name || finalProfile?.full_name || finalProfile?.name || finalProfile?.email || "Unknown";
                    const safeAuthorAvatar = finalProfile?.avatar || "/placeholder.svg";
                    const safeAuthorUsername = safeAuthorName ? `@${safeAuthorName.toLowerCase().replace(/\s+/g, '')}` : "@unknown";
                    const safeAuthorSport = finalProfile?.sport || finalProfile?.user_type || "athlete";
                    const safeCreatedAt = post?.created_at;
                    const safeLikes = post?.likes || 0;
                    const safeComments = post?.comments || 0;
                    const safeShares = post?.shares || 0;

                    const transformedPost = {
                      id: safeId,
                      author: {
                        name: post.users?.display_name || safeAuthorName,
                        username: post.users?.email ? `@${post.users.email.split("@")[0]}` : safeAuthorUsername,
                        avatar: post.users?.avatar || safeAuthorAvatar,
                        sport: post.users?.sport || safeAuthorSport,
                        verified: false,
                        id: post.users?.id || currentProfile?.id,
                        profile: post.users || currentProfile,
                      },
                      content: safeDescription,
                      image: safeMediaUrl,
                      images: post?.images || [], // Add images array for PostCard
                      likes: post.likes_count || safeLikes,
                      comments: post.comments_count || safeComments,
                      shares: post.shares_count || safeShares,
                      timeAgo: safeCreatedAt ? formatTimeAgo(safeCreatedAt) : "",
                      category: post.users?.sport || safeAuthorSport,
                      isLiked: post.isLiked || false,
                      isSaved: post.isSaved || false,
                    };

                    return (
                      <PostCard
                        key={post.id}
                        post={transformedPost}
                      onProfileClick={onProfileClick}
                        showTopMenu={isOwnProfile}
                        userId={loggedInUserId || ""}
                      onSaveChange={onSaveChange}
                        onDelete={handleDeletePost}
                        isSaved={transformedPost.isSaved}
                        onPostClick={handlePostClick}
                    />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* About Content */}
          {activeTab === 'about' && (
            <div className="mt-6 bg-card rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-foreground mb-4 text-lg">About</h3>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {currentProfile.bio || "No bio available."}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Details</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>Location:</strong> {currentProfile.location || "Not specified"}</p>
                      <p><strong>Joined:</strong> {currentProfile.joinDate || "Not specified"}</p>
                      <p><strong>Sport:</strong> {currentProfile.sport || "Not specified"}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Stats</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>Followers:</strong> {currentProfile.followers?.toLocaleString() || "0"}</p>
                      <p><strong>Following:</strong> {currentProfile.following?.toLocaleString() || "0"}</p>
                      <p><strong>Posts:</strong> {currentProfile.posts || "0"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Delete confirmation dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Post</DialogTitle>
            </DialogHeader>
            <div>Are you sure you want to delete this post? This action cannot be undone.</div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => postToDelete && handleDeletePost(postToDelete)}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // DESKTOP/TABLET LAYOUT
  return (
    <>
      {/* Back button for other profiles */}
      {!isOwnProfile && onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      {/* Main Profile Header Section - image left, details right */}
      <div className="w-full bg-card rounded-3xl shadow-lg flex flex-col md:flex-row items-center md:items-stretch p-8 gap-8 mt-8">
        {/* Profile Image - left side */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center w-full md:w-auto relative">
          <img
            src={imageLoadError ? "/placeholder.svg" : getAvatarUrl(profileImage || normalizedProfile?.avatar)}
            alt="Profile"
            className="w-64 h-80 object-cover rounded-2xl border-4 border-background shadow-md bg-muted"
            style={{ minWidth: 220, minHeight: 220 }}
            onError={() => {
              console.log("Desktop profile image failed to load:", profileImage || normalizedProfile?.avatar);
              setImageLoadError(true);
            }}
            onLoad={() => {
              console.log("Desktop profile image loaded successfully:", profileImage || normalizedProfile?.avatar);
              setImageLoadError(false);
            }}
          />
          {isOwnProfile && (
            <button
              className="absolute bottom-3 right-3 bg-background rounded-full p-2 shadow-md border border-border hover:bg-[#0e9591] group transition"
              onClick={() => setShowImageDialog(true)}
              aria-label="Change profile image"
              style={{ zIndex: 10 }}
            >
              <Camera className="h-5 w-5 text-[#0e9591] group-hover:text-white transition-colors" />
            </button>
          )}
          {/* Profile Image Change Modal for Desktop */}
          <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
            <DialogContent className="max-w-xs w-full p-4 text-center">
              <DialogHeader>
                <DialogTitle>Change Profile Image</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-2">
                <button
                  className="bg-[#0e9591] text-white py-2 rounded-lg font-semibold"
                  onClick={() => {
                    setShowImageDialog(false);
                    setTimeout(() => cameraInputRef.current?.click(), 200);
                  }}
                  disabled={uploading}
                >
                  Open Camera
                </button>
                <button
                  className="bg-muted text-foreground py-2 rounded-lg font-semibold"
                  onClick={() => {
                    setShowImageDialog(false);
                    setTimeout(() => galleryInputRef.current?.click(), 200);
                  }}
                  disabled={uploading}
                >
                  Open Gallery
                </button>
                {uploading && <Spinner />}
              </div>
            </DialogContent>
          </Dialog>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            style={{ display: 'none' }}
            onChange={async (e) => {
              setUploading(true);
              await handleFileChange(e);
              setUploading(false);
            }}
          />
          <input
            type="file"
            accept="image/*"
            ref={galleryInputRef}
            style={{ display: 'none' }}
            onChange={async (e) => {
              setUploading(true);
              await handleFileChange(e);
              setUploading(false);
            }}
          />
        </div>
        {/* Profile Details - right side */}
        <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              {getDisplayName(finalProfile)}
              <span className="ml-2 text-[#0e9591] text-xl">🏆</span>
            </h1>
          </div>
          <div className="mb-2">
            <span className="bg-[#0e9591] text-white px-4 py-1 rounded-full text-base font-semibold tracking-wide">
              {finalProfile?.sport?.toUpperCase() || 'SPORT'}
            </span>
          </div>
          <div className="flex gap-4 text-base text-foreground mb-2">
            <span><span className="font-semibold">117M</span> Supporters</span>
            <span>•</span>
            <span><span className="font-semibold">15</span> Supporting</span>
          </div>
          <div className="mb-4 text-muted-foreground text-base max-w-xl">
            Bienvenidos a la página de Trofify Oficial de {finalProfile?.name}. Welcome to the official {finalProfile?.name} page
          </div>
          <div className="flex gap-4 w-full max-w-md justify-center md:justify-start">
            {isOwnProfile ? (
              <button className="flex-1 bg-muted text-foreground border-2 border-border py-2 rounded-lg font-semibold text-base shadow">Add Story</button>
            ) : (
              <>
                <button className="flex-1 bg-[#0e9591] text-white py-2 rounded-lg font-semibold text-base shadow hover:bg-[#087a74] transition">Support</button>
                <button 
                  onClick={handleMessageClick}
                  className="flex-1 bg-muted text-foreground border-2 border-border py-2 rounded-lg font-semibold text-base shadow hover:bg-muted/80 transition-colors"
                >
                  Message
                </button>
              </>
            )}
            <button className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-xl font-bold text-muted-foreground border-2 border-border">...</button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="w-full mt-8 border-b-2 border-border">
        <div className="flex space-x-8 overflow-x-auto justify-center">
          {['Posts', 'Photos', 'Videos', 'About'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`py-3 px-1 border-b-2 font-medium text-lg capitalize whitespace-nowrap transition-colors duration-150 ${
                activeTab === tab.toLowerCase()
                  ? 'border-[#0e9591] text-[#0e9591]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content (Posts, About, etc.) */}
      <div className="w-full mt-6">
        <div
          style={{
            opacity: (uploading || postsLoading) ? 0.3 : 1,
            pointerEvents: (uploading || postsLoading) ? 'none' : 'auto',
            userSelect: (uploading || postsLoading) ? 'none' : 'auto',
            transition: 'opacity 0.2s',
          }}
        >
          {activeTab === 'posts' && (
            <div className="space-y-6 px-0 mx-0 lg:px-0 lg:mx-0">
              {postsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0e9591]"></div>
                    <p className="text-foreground font-medium">Loading posts...</p>
                  </div>
                </div>
              ) : postsError ? (
                <div className="text-destructive text-sm p-4">{postsError}</div>
              ) : posts.length === 0 ? (
                <div className="text-muted-foreground text-center p-4">No posts yet.</div>
              ) : (
                <div className="space-y-0">
                  {(posts || []).filter(Boolean).map((post) => {
                    // Transform post data to match PostCard format
                    const transformedPost = {
                      id: post.id,
                      author: {
                        name: finalProfile?.name || finalProfile?.display_name || "Unknown",
                        username: finalProfile?.name ? `@${finalProfile.name.toLowerCase().replace(/\s+/g, '')}` : finalProfile?.email,
                        avatar: finalProfile?.avatar || "/placeholder.svg",
                        sport: finalProfile?.sport || finalProfile?.user_type || "athlete",
                        verified: false,
                        id: finalProfile?.id,
                        profile: finalProfile,
                      },
                      content: post.description,
                      image: (post.images && post.images.length > 0) ? post.images[0] : (post.media_url ? `https://trofify-media.s3.amazonaws.com/${post.media_url}` : ""),
                      images: post?.images || [], // Add images array for PostCard
                      likes: post.likes || 0,
                      comments: post.comments || 0,
                      shares: post.shares || 0,
                      timeAgo: post.created_at ? formatTimeAgo(post.created_at) : "",
                      category: currentProfile.sport || currentProfile.user_type,
                    };

                    return (
                                          <div key={post.id} className="border-b-2 border-border">
                      <PostCard
                        post={transformedPost}
                        onProfileClick={onProfileClick}
                        showTopMenu={isOwnProfile}
                        userId={loggedInUserId || ""}
                        onSaveChange={onSaveChange}
                        onDelete={handleDeletePost}
                        isSaved={false} // Profile posts are not known to be saved initially
                        onPostClick={handlePostClick}
                      />
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {activeTab === 'about' && (
            <div className="mt-6 bg-card rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-foreground mb-4 text-lg">About</h3>
              <table className="min-w-full text-sm">
                <tbody>
                  {/* USERS table fields (common) */}
                  {currentProfile.email && (
                    <tr><td className="font-medium pr-4 py-1">Email</td><td>{currentProfile.email}</td></tr>
                  )}
                  {currentProfile.user_type && (
                    <tr><td className="font-medium pr-4 py-1">User Type</td><td>{currentProfile.user_type}</td></tr>
                  )}
                  {currentProfile.phone_number && (
                    <tr><td className="font-medium pr-4 py-1">Phone Number</td><td>{currentProfile.phone_number}</td></tr>
                  )}
                  {/* ATHLETES table */}
                  {currentProfile.user_type === 'athlete' && [
                    <tr key="full_name"><td className="font-medium pr-4 py-1">Full Name</td><td>{currentProfile.full_name}</td></tr>,
                    <tr key="sport"><td className="font-medium pr-4 py-1">Sport</td><td>{currentProfile.sport}</td></tr>,
                    <tr key="level"><td className="font-medium pr-4 py-1">Level</td><td>{currentProfile.level}</td></tr>,
                    <tr key="achievements"><td className="font-medium pr-4 py-1">Achievements</td><td>{currentProfile.achievements}</td></tr>,
                    <tr key="date_of_birth"><td className="font-medium pr-4 py-1">Date of Birth</td><td>{currentProfile.date_of_birth}</td></tr>,
                    <tr key="location"><td className="font-medium pr-4 py-1">Location</td><td>{currentProfile.location}</td></tr>,
                  ]}
                  {/* COACHES table */}
                  {currentProfile.user_type === 'coach' && [
                    <tr key="full_name"><td className="font-medium pr-4 py-1">Full Name</td><td>{currentProfile.full_name}</td></tr>,
                    <tr key="sport"><td className="font-medium pr-4 py-1">Sport</td><td>{currentProfile.sport}</td></tr>,
                    <tr key="experience"><td className="font-medium pr-4 py-1">Experience</td><td>{currentProfile.experience}</td></tr>,
                    <tr key="certifications"><td className="font-medium pr-4 py-1">Certifications</td><td>{currentProfile.certifications}</td></tr>,
                    <tr key="specialization"><td className="font-medium pr-4 py-1">Specialization</td><td>{currentProfile.specialization}</td></tr>,
                    <tr key="organization"><td className="font-medium pr-4 py-1">Organization</td><td>{currentProfile.organization}</td></tr>,
                    <tr key="location"><td className="font-medium pr-4 py-1">Location</td><td>{currentProfile.location}</td></tr>,
                  ]}
                  {/* FANS table */}
                  {currentProfile.user_type === 'fan' && [
                    <tr key="full_name"><td className="font-medium pr-4 py-1">Full Name</td><td>{currentProfile.full_name}</td></tr>,
                    <tr key="favorite_sports"><td className="font-medium pr-4 py-1">Favorite Sports</td><td>{currentProfile.favorite_sports}</td></tr>,
                    <tr key="favorite_teams"><td className="font-medium pr-4 py-1">Favorite Teams</td><td>{currentProfile.favorite_teams}</td></tr>,
                    <tr key="interests"><td className="font-medium pr-4 py-1">Interests</td><td>{currentProfile.interests}</td></tr>,
                    <tr key="location"><td className="font-medium pr-4 py-1">Location</td><td>{currentProfile.location}</td></tr>,
                  ]}
                  {/* VENUES table */}
                  {currentProfile.user_type === 'venue' && [
                    <tr key="owner_name"><td className="font-medium pr-4 py-1">Owner Name</td><td>{currentProfile.owner_name}</td></tr>,
                    <tr key="venue_name"><td className="font-medium pr-4 py-1">Venue Name</td><td>{currentProfile.venue_name}</td></tr>,
                    <tr key="venue_type"><td className="font-medium pr-4 py-1">Venue Type</td><td>{currentProfile.venue_type}</td></tr>,
                    <tr key="address"><td className="font-medium pr-4 py-1">Address</td><td>{currentProfile.address}</td></tr>,
                    <tr key="city"><td className="font-medium pr-4 py-1">City</td><td>{currentProfile.city}</td></tr>,
                    <tr key="state"><td className="font-medium pr-4 py-1">State</td><td>{currentProfile.state}</td></tr>,
                    <tr key="zip_code"><td className="font-medium pr-4 py-1">Zip Code</td><td>{currentProfile.zip_code}</td></tr>,
                    <tr key="website"><td className="font-medium pr-4 py-1">Website</td><td>{currentProfile.website}</td></tr>,
                    <tr key="facilities"><td className="font-medium pr-4 py-1">Facilities</td><td>{currentProfile.facilities}</td></tr>,
                    <tr key="capacity"><td className="font-medium pr-4 py-1">Capacity</td><td>{currentProfile.capacity}</td></tr>,
                    <tr key="description"><td className="font-medium pr-4 py-1">Description</td><td>{currentProfile.description}</td></tr>,
                    <tr key="phone_number"><td className="font-medium pr-4 py-1">Phone Number</td><td>{currentProfile.phone_number}</td></tr>,
                  ]}
                  {/* SPORTS BRANDS table */}
                  {currentProfile.user_type === 'sports_brand' && [
                    <tr key="contact_name"><td className="font-medium pr-4 py-1">Contact Name</td><td>{currentProfile.contact_name}</td></tr>,
                    <tr key="brand_name"><td className="font-medium pr-4 py-1">Brand Name</td><td>{currentProfile.brand_name}</td></tr>,
                    <tr key="company_type"><td className="font-medium pr-4 py-1">Company Type</td><td>{currentProfile.company_type}</td></tr>,
                    <tr key="website"><td className="font-medium pr-4 py-1">Website</td><td>{currentProfile.website}</td></tr>,
                    <tr key="phone_number"><td className="font-medium pr-4 py-1">Phone Number</td><td>{currentProfile.phone_number}</td></tr>,
                    <tr key="address"><td className="font-medium pr-4 py-1">Address</td><td>{currentProfile.address}</td></tr>,
                    <tr key="city"><td className="font-medium pr-4 py-1">City</td><td>{currentProfile.city}</td></tr>,
                    <tr key="state"><td className="font-medium pr-4 py-1">State</td><td>{currentProfile.state}</td></tr>,
                    <tr key="zip_code"><td className="font-medium pr-4 py-1">Zip Code</td><td>{currentProfile.zip_code}</td></tr>,
                    <tr key="product_categories"><td className="font-medium pr-4 py-1">Product Categories</td><td>{currentProfile.product_categories}</td></tr>,
                    <tr key="target_markets"><td className="font-medium pr-4 py-1">Target Markets</td><td>{currentProfile.target_markets}</td></tr>,
                    <tr key="description"><td className="font-medium pr-4 py-1">Description</td><td>{currentProfile.description}</td></tr>,
                  ]}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    {/* Move spinner overlay to the end and increase z-index */}
    {(uploading || postsLoading || navigatingBack) && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.35)',
        zIndex: 99999, // higher than modal/dialog
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.2s',
      }}>
        <Spinner />
      </div>
    )}
    
    {selectedPost && (
      <PostModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        userId={loggedInUserId || ""}
        onProfileClick={onProfileClick}
        onSaveChange={onSaveChange}
      />
    )}
    </>
  );
};
