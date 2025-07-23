import { useState } from "react";
import { Calendar, MapPin, Users, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const EventsView = () => {
  const [activeTab, setActiveTab] = useState("upcoming");

  const upcomingEvents = [
    {
      id: 1,
      title: "Basketball Championship 2024",
      date: "December 15, 2024",
      time: "6:00 PM",
      location: "Madison Square Garden, New York",
      organizer: "Sports Central",
      organizerAvatar:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop&crop=face",
      attendees: 1250,
      image:
        "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=300&fit=crop",
      category: "Tournament",
      verified: true,
    },
    {
      id: 2,
      title: "Football Training Camp",
      date: "December 18, 2024",
      time: "9:00 AM",
      location: "City Sports Complex, Manchester",
      organizer: "Elite Football Academy",
      organizerAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      attendees: 150,
      image:
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=300&fit=crop",
      category: "Training",
      verified: true,
    },
    {
      id: 3,
      title: "Swimming Championships",
      date: "December 22, 2024",
      time: "2:00 PM",
      location: "Olympic Aquatic Center, London",
      organizer: "Swimming Federation",
      organizerAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      attendees: 800,
      image:
        "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&h=300&fit=crop",
      category: "Competition",
      verified: true,
    },
  ];

  const myEvents = [
    {
      id: 1,
      title: "Tennis Workshop",
      date: "December 10, 2024",
      time: "4:00 PM",
      location: "Local Tennis Club",
      role: "Attending",
      status: "confirmed",
    },
    {
      id: 2,
      title: "Football Match",
      date: "December 12, 2024",
      time: "7:30 PM",
      location: "City Stadium",
      role: "Playing",
      status: "confirmed",
    },
  ];

  return (
    <div className="w-full lg:px-4 lg:max-w-4xl lg:mx-auto px-0 mx-0">
      <div className="bg-card rounded-none lg:rounded-lg shadow-sm lg:mx-0 p-0 m-0 border-0">
        {/* Header */}
        <div className="p-3 sm:p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Events
            </h1>
            <Button className="self-start sm:self-auto">Create Event</Button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 sm:space-x-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`pb-2 border-b-2 font-medium whitespace-nowrap text-sm sm:text-base ${
                activeTab === "upcoming"
                  ? "border-[#0e9591] text-[#0e9591]"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              Discover Events
            </button>
            <button
              onClick={() => setActiveTab("my-events")}
              className={`pb-2 border-b-2 font-medium whitespace-nowrap text-sm sm:text-base ${
                activeTab === "my-events"
                  ? "border-[#0e9591] text-[#0e9591]"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              My Events
            </button>
            <button
              onClick={() => setActiveTab("hosting")}
              className={`pb-2 border-b-2 font-medium whitespace-nowrap text-sm sm:text-base ${
                activeTab === "hosting"
                  ? "border-[#0e9591] text-[#0e9591]"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              Hosting
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-0 sm:p-6">
          {activeTab === "upcoming" && (
            <div className="space-y-6">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-none lg:rounded-lg overflow-hidden hover:shadow-md transition-shadow p-0 m-0 border-0"
                >
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded-none lg:rounded-lg m-0"
                  />
                  <div className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-4 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {event.title}
                          </h3>
                          {event.verified && (
                            <div className="w-5 h-5 bg-[#0e9591] rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                          <Badge variant="secondary">{event.category}</Badge>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{event.date}</span>
                            <Clock className="h-4 w-4 ml-4" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>
                              {event.attendees.toLocaleString()} attending
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 mt-4">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={event.organizerAvatar} />
                            <AvatarFallback>
                              {event.organizer[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600">
                            by {event.organizer}
                          </span>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <div className="text-lg font-semibold text-green-600 mb-3">
                          {event.attendees} attendees
                        </div>
                        <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button size="sm" className="w-full sm:w-auto">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "my-events" && (
            <div className="space-y-4">
              {myEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg space-y-3 sm:space-y-0"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {event.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {event.date}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {event.time}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {event.location}
                      </span>
                    </div>
                    <Badge variant="outline" className="mt-2">
                      {event.role}
                    </Badge>
                  </div>
                  <div className="flex space-x-2 self-start sm:self-auto">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Share
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "hosting" && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No events hosted yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first event to get started
              </p>
              <Button>Create Event</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
