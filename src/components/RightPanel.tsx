
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";

interface RightPanelProps {
  onProfileClick?: (profile: any) => void;
}

export const RightPanel = ({ onProfileClick }: RightPanelProps) => {
  const suggestions = [
    {
      name: "Tom Anderson",
      sport: "Basketball",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
      mutualConnections: 12,
      verified: true
    },
    {
      name: "Maria Garcia",
      sport: "Tennis",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
      mutualConnections: 8,
      verified: false
    },
    {
      name: "David Kim",
      sport: "Swimming",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      mutualConnections: 15,
      verified: true
    }
  ];

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
      {/* People You May Know */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center">
          <Users className="h-4 w-4 mr-2" />
          People You May Know
        </h3>
        <div className="space-y-4">
          {suggestions.map((person, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar 
                  className="h-10 w-10 cursor-pointer" 
                  onClick={() => onProfileClick?.(person)}
                >
                  <AvatarImage src={person.avatar} />
                  <AvatarFallback>{person.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-foreground text-sm">{person.name}</span>
                    {person.verified && (
                      <div className="w-3 h-3 bg-[#0e9591] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs mt-1 bg-[#0e9591] text-white">
                    {person.sport}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {person.mutualConnections} mutual connections
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Connect
              </Button>
            </div>
          ))}
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
