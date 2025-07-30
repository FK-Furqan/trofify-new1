
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toProperCase } from "@/lib/utils";
import { Calendar, MapPin, Trophy, Users, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { getBackendUrl } from "@/lib/utils";

interface RightPanelProps {
  onProfileClick?: (profile: any) => void;
  onMessageClick?: (userId: string) => void;
  currentUserId?: string;
}

export const RightPanel = ({ onProfileClick, onMessageClick, currentUserId }: RightPanelProps) => {
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent posts
  useEffect(() => {
    const fetchRecentPosts = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${getBackendUrl()}/api/posts/recent?limit=3&user_id=${currentUserId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Recent posts data received:', data);
          console.log('Number of posts:', data.length);
          setRecentPosts(data.slice(0, 3)); // Ensure only 3 posts
        }
      } catch (error) {
        console.error('Failed to fetch recent posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPosts();
  }, [currentUserId]);

  const upcomingEvents = [
    {
      title: "Basketball Championship",
      date: "Dec 15, 2024",
      location: "Madison Square Garden",
      attendees: 1250,
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&h=200&fit=crop"
    },
    {
      title: "Tennis Open Tournament",
      date: "Dec 18, 2024",
      location: "Wimbledon",
      attendees: 890,
      image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=300&h=200&fit=crop"
    },
    {
      title: "Swimming Championships",
      date: "Dec 22, 2024",
      location: "Olympic Pool",
      attendees: 675,
      image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=300&h=200&fit=crop"
    }
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Recent Posts */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Recent Posts
        </h3>
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded"></div>
                      <div className="h-3 w-16 bg-muted rounded"></div>
                      <div className="h-3 w-20 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="h-8 w-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : recentPosts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent posts</p>
          ) : (
            recentPosts.map((post, index) => (
              <div key={post.id || `post-${index}`} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar 
                  className="h-10 w-10 cursor-pointer" 
                    onClick={() => {
                      console.log('Profile clicked:', post.author);
                      onProfileClick?.(post.author);
                    }}
                >
                    <AvatarImage src={post.author?.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{(post.author?.display_name || post.author?.email || "U")[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-1">
                      <span 
                        className="trofify-profile-name cursor-pointer hover:text-[#0e9591] transition-colors"
                        onClick={() => onProfileClick?.(post.author)}
                      >
                        {post.author?.display_name || post.author?.email?.split('@')[0] || "Unknown"}
                      </span>
                      {post.author?.verified && (
                      <div className="w-3 h-3 bg-[#0e9591] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    {post.author?.userSport && (
                      <Badge variant="secondary" className="text-xs bg-gray-600 text-white flex items-center justify-center">
                        {toProperCase(post.author.userSport)}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs bg-[#0e9591] text-white flex items-center justify-center">
                      {toProperCase(post.author?.sport || post.author?.user_type || "user")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                      {post.supporter_count || 0} supporters
                  </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    console.log('Message clicked for user ID:', post.author?.id || post.user_id);
                    onMessageClick?.(post.author?.id || post.user_id);
                  }}
                  className="flex items-center space-x-1"
                >
                  <MessageCircle className="h-3 w-3" />
                  <span>Message</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Upcoming Events
        </h3>
        <div className="space-y-4">
          {upcomingEvents.map((event, index) => (
            <div key={index} className="border border-border rounded-lg p-3 hover:bg-muted cursor-pointer transition-colors">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-24 object-cover rounded-lg mb-2"
              />
              <h4 className="font-medium text-foreground text-sm">{event.title}</h4>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                {event.date}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {event.location}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Users className="h-3 w-3 mr-1" />
                {event.attendees} attending
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
