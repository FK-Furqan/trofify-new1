import { Trophy, Calendar, Users, Award, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const CompetitionsView = () => {
  const competitions = [
    {
      id: 1,
      name: "Premier Football League 2024",
      sport: "Football",
      status: "Ongoing",
      participants: 20,
      prize: "$500K",
      endDate: "Dec 31, 2024",
      image:
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=200&fit=crop",
    },
    {
      id: 2,
      name: "Basketball Championship",
      sport: "Basketball",
      status: "Registration Open",
      participants: 16,
      prize: "$250K",
      endDate: "Jan 15, 2025",
      image:
        "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=200&fit=crop",
    },
  ];

  return (
    <div className="w-full lg:px-4 lg:max-w-4xl lg:mx-auto px-0 mx-0">
      <div className="bg-card rounded-none lg:rounded-lg shadow-sm lg:mx-0 p-0 m-0 border-0">
        <div className="p-3 sm:p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
            Competitions
          </h1>
        </div>
        <div className="p-0 sm:p-6">
          <div className="space-y-6">
            {competitions.map((comp) => (
              <div key={comp.id} className="border border-border rounded-none lg:rounded-lg overflow-hidden hover:shadow-md transition-shadow p-0 m-0">
                <img
                  src={comp.image}
                  alt={comp.name}
                  className="w-full h-48 object-cover rounded-none lg:rounded-lg m-0"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{comp.name}</h3>
                  <p className="text-muted-foreground mb-3">{comp.sport} Competition</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {comp.endDate}
                      </span>
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {comp.participants} teams
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {comp.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
