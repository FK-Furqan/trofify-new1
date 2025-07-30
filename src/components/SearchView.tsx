import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Grid, List, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PostCard } from "./PostCard";
import { PostModal } from "./PostModal";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getBackendUrl, formatTimestamp } from "@/lib/utils";
import { UniversalLoader } from "@/components/ui/universal-loader";

interface SearchViewProps {
  onProfileClick?: (profile: any) => void;
  userId: string;
  onSaveChange?: () => void;
  onLoadingComplete?: () => void;
}

export const SearchView = ({ onProfileClick, userId, onSaveChange, onLoadingComplete }: SearchViewProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profilesCache, setProfilesCache] = useState(new Map());
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Available filter categories
  const filterCategories = [
    "All",
    "Athlete",
    "Coach", 
    "Fan",
    "Venue",
    "Sports Brand",
    "Football",
    "Basketball", 
    "Tennis",
    "Swimming",
    "Running",
    "Cycling",
    "Golf",
    "Baseball",
    "Soccer",
    "Volleyball",
    "Boxing",
    "Wrestling",
    "Gymnastics",
    "Track & Field",
    "CrossFit",
    "Martial Arts"
  ];

  // Fetch all posts for search
  const fetchPosts = useCallback(async () => {
    if (hasInitiallyLoaded) return; // Prevent multiple fetches
    
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${getBackendUrl()}/api/posts?user_id=${userId}`);
      const data = res.data;
      
      // Map API data to PostCard structure with profile caching
      const mapped = await Promise.all(data.map(async (post: any) => {
        let author = {
          name: post.users?.display_name || post.users?.email || post.email || "Unknown",
          username: post.users?.email ? `@${post.users.email.split("@")[0]}` : post.email,
          avatar: post.users?.avatar || "/placeholder.svg",
          sport: post.users?.user_type || post.user_type, // This will be displayed in the badge
          userSport: post.users?.sport, // This is the actual sport for filtering
          verified: false,
          id: post.user_id,
          profile: post.users || null,
        };

        // Check cache first
        if (profilesCache.has(post.email)) {
          const cachedProfile = profilesCache.get(post.email);
          author = {
            name: cachedProfile.display_name || cachedProfile.email || post.email || "Unknown",
            username: cachedProfile.email ? `@${cachedProfile.email.split("@")[0]}` : post.email,
            avatar: cachedProfile.avatar || post.users?.avatar || "/placeholder.svg",
            sport: cachedProfile.user_type || cachedProfile.sport || post.users?.user_type || post.user_type,
            userSport: cachedProfile.sport || post.users?.sport,
            verified: false,
            id: post.user_id,
            profile: cachedProfile,
          };
        } else {
          // Fetch profile only if not cached
          try {
            const profileRes = await fetch(`${getBackendUrl()}/signup/profile`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: post.email }),
            });
            if (profileRes.ok) {
              const profile = await profileRes.json();
              // Cache the profile
              setProfilesCache(prev => new Map(prev).set(post.email, profile));
              author = {
                name: profile.name || post.email,
                username: profile.email ? `@${profile.email.split("@")[0]}` : post.email,
                avatar: profile.avatar || "",
                sport: profile.user_type || profile.sport || post.users?.user_type || post.user_type,
                userSport: profile.sport || post.users?.sport,
                verified: false,
                id: post.user_id,
                profile: profile,
              };
            }
          } catch {}
        }

        return {
          id: post.id,
          author,
          content: post.description,
          image: (post.images && post.images.length > 0) ? post.images[0] : (post.media_url || ""),
          images: post.images || [], // Add images array for carousel
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          shares: post.shares_count || 0,
          timeAgo: post.created_at ? formatTimestamp(post.created_at) : "",
          category: author.sport,
          isLiked: !!post.isLiked,
          isSaved: !!post.isSaved,
        };
      }));
      
      setPosts(mapped);
      setFilteredPosts(mapped);
      setHasInitiallyLoaded(true);
    } catch (err: any) {
      setError(err.message || "Failed to load posts");
    } finally {
      setLoading(false);
      if (onLoadingComplete) onLoadingComplete();
    }
  }, []); // Remove profilesCache dependency

  useEffect(() => {
    fetchPosts();
  }, []); // Only run once on mount

  // Filter posts based on search query and selected filter
  useEffect(() => {
    let filtered = posts;

    // Apply category filter
    if (selectedFilter !== "All") {
      filtered = filtered.filter(post => {
        const filterLower = selectedFilter.toLowerCase();
        return (
          post.category?.toLowerCase() === filterLower ||
          post.author.sport?.toLowerCase() === filterLower ||
          post.author.userSport?.toLowerCase() === filterLower
        );
      });
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.content?.toLowerCase().includes(query) ||
        post.author.name?.toLowerCase().includes(query) ||
        post.author.sport?.toLowerCase().includes(query) ||
        post.author.userSport?.toLowerCase().includes(query) ||
        post.author.username?.toLowerCase().includes(query)
      );
    }

    setFilteredPosts(filtered);
  }, [searchQuery, selectedFilter, posts]);



  const handlePostClick = (post: any) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };





  if (error) {
    return (
      <div className="w-full lg:px-4 lg:max-w-4xl lg:mx-auto px-0 mx-0">
        <div className="bg-card rounded-none lg:rounded-lg shadow-sm p-6">
          <p className="text-destructive">Error: {error}</p>
        </div>
      </div>
    );
  }

  // Unified skeleton loader (same as Feed)
  const renderSkeleton = () => <UniversalLoader />;

  return (
    <div className="w-full lg:px-4 lg:max-w-4xl lg:mx-auto px-0 mx-0">
      <div className="bg-card rounded-none lg:rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-border">
  
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search posts, users, or categories..."
              className="pl-10 bg-muted/50 border-input focus:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* View Toggle and Filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-[#0e9591] text-white' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-[#0e9591] text-white' : ''}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>{selectedFilter}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 max-h-60 overflow-y-auto">
                {filterCategories.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => setSelectedFilter(category)}
                    className={selectedFilter === category ? "bg-[#0e9591] text-white" : ""}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className={viewMode === 'list' ? 'p-0' : 'p-6'}>
          {loading && !hasInitiallyLoaded ? (
            renderSkeleton()
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No posts found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse all posts
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-0">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onProfileClick={onProfileClick}
                  showTopMenu={false}
                  userId={userId}
                  onSaveChange={onSaveChange}
                  isSaved={post.isSaved}
                  onPostClick={handlePostClick}
                />
              ))}
            </div>
          ) : (
            // Responsive grid view using PostCard
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onProfileClick={onProfileClick}
                  showTopMenu={false}
                  userId={userId}
                  onSaveChange={onSaveChange}
                  isSaved={post.isSaved}
                  variant="grid"
                  onPostClick={handlePostClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          userId={userId}
          onProfileClick={onProfileClick}
          onSaveChange={onSaveChange}
        />
      )}
    </div>
  );
}; 