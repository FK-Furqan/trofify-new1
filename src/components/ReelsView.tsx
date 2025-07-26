
import { useState } from "react";
import { Heart, MessageCircle, Share, Play, Pause } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getBackendUrl } from "@/lib/utils";

interface ReelsViewProps {
  onProfileClick?: (profile: any) => void;
}

export const ReelsView = ({ onProfileClick }: ReelsViewProps) => {
  const [currentReel, setCurrentReel] = useState(0);
  const [playing, setPlaying] = useState(true);

  const reels = [
    {
      id: 1,
      author: {
        name: "Alex Rodriguez",
        username: "@alexrod_tennis",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
        sport: "Tennis"
      },
      video: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&h=600&fit=crop",
      caption: "Perfecting my backhand technique! 🎾",
      likes: 245,
      comments: 18,
      shares: 8
    },
    {
      id: 2,
      author: {
        name: "Sarah Johnson",
        username: "@sarahj_swimmer",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b977?w=100&h=100&fit=crop&crop=face",
        sport: "Swimming"
      },
      video: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=600&fit=crop",
      caption: "Morning swim routine 🏊‍♀️",
      likes: 189,
      comments: 12,
      shares: 5
    }
  ];

  const handleProfileClick = async (author: any) => {
    if (onProfileClick) {
      try {
        // Fetch complete user profile data from backend
        const response = await fetch(`${getBackendUrl()}/api/users/${author.id}`);
        if (response.ok) {
          const completeProfile = await response.json();
          console.log("ReelsView: Complete profile fetched:", completeProfile);
          onProfileClick(completeProfile);
        } else {
          console.error('Failed to fetch complete profile, using fallback');
          // Fallback to basic profile data if fetch fails
          onProfileClick({
            id: author.id,
            name: author.name,
            display_name: author.name,
            username: author.username,
            avatar: author.avatar,
            sport: author.sport,
            user_type: author.sport,
            verified: false,
            bio: `Professional ${author.sport} Player`,
            coverImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=400&fit=crop",
            location: "New York, USA",
            joinDate: "March 2022",
            followers: Math.floor(Math.random() * 50000) + 10000,
            following: Math.floor(Math.random() * 1000) + 100,
            posts: Math.floor(Math.random() * 200) + 50
          });
        }
      } catch (error) {
        console.error('Error fetching complete profile:', error);
        // Fallback to basic profile data if fetch fails
        onProfileClick({
          id: author.id,
          name: author.name,
          display_name: author.name,
          username: author.username,
          avatar: author.avatar,
          sport: author.sport,
          user_type: author.sport,
          verified: false,
          bio: `Professional ${author.sport} Player`,
          coverImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=400&fit=crop",
          location: "New York, USA",
          joinDate: "March 2022",
          followers: Math.floor(Math.random() * 50000) + 10000,
          following: Math.floor(Math.random() * 1000) + 100,
          posts: Math.floor(Math.random() * 200) + 50
        });
      }
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-black relative overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-full max-w-sm h-full bg-gray-900 rounded-lg overflow-hidden">
          <img 
            src={reels[currentReel].video} 
            alt="Reel content"
            className="w-full h-full object-cover"
          />
          
          {/* Play/Pause overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setPlaying(!playing)}
              className="bg-black/20 hover:bg-black/40 text-white"
            >
              {playing ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
            </Button>
          </div>

          {/* User info overlay */}
          <div className="absolute bottom-4 left-4 right-16 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <Avatar 
                className="h-8 w-8 cursor-pointer border-2 border-white"
                onClick={() => handleProfileClick(reels[currentReel].author)}
              >
                <AvatarImage src={reels[currentReel].author.avatar} />
                <AvatarFallback>{reels[currentReel].author.name[0]}</AvatarFallback>
              </Avatar>
              <span 
                className="font-semibold text-sm cursor-pointer"
                onClick={() => handleProfileClick(reels[currentReel].author)}
              >
                {reels[currentReel].author.username}
              </span>
            </div>
            <p className="text-sm">{reels[currentReel].caption}</p>
          </div>

          {/* Action buttons */}
          <div className="absolute bottom-4 right-4 flex flex-col space-y-4">
            <Button variant="ghost" size="sm" className="text-white p-2">
              <Heart className="h-6 w-6" />
              <span className="text-xs mt-1 block">{reels[currentReel].likes}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-white p-2">
              <MessageCircle className="h-6 w-6" />
              <span className="text-xs mt-1 block">{reels[currentReel].comments}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-white p-2">
              <Share className="h-6 w-6" />
              <span className="text-xs mt-1 block">{reels[currentReel].shares}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {reels.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full ${index === currentReel ? 'bg-white' : 'bg-white/50'}`}
            onClick={() => setCurrentReel(index)}
          />
        ))}
      </div>
    </div>
  );
};
