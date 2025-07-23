import { MapPin, Star, Phone, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const VenuesView = () => {
  const venues = [
    {
      id: 1,
      name: "Elite Sports Complex",
      type: "Multi-Sport Facility",
      rating: 4.8,
      distance: "2.3 km",
      address: "123 Sports Avenue, City Center",
      phone: "+1 234-567-8900",
      hours: "6:00 AM - 10:00 PM",
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop",
      amenities: ["Swimming Pool", "Gym", "Courts"],
    },
    {
      id: 2,
      name: "Thunder Stadium",
      type: "Football Stadium",
      rating: 4.9,
      distance: "5.1 km",
      address: "456 Stadium Road, Sports District",
      phone: "+1 234-567-8901",
      hours: "Event Based",
      image:
        "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=200&fit=crop",
      amenities: ["Large Capacity", "Premium Seating", "Parking"],
    },
  ];

  return (
    <div className="w-full lg:px-4 lg:max-w-4xl lg:mx-auto px-0 mx-0">
      <div className="bg-card rounded-none lg:rounded-lg shadow-sm lg:mx-0 p-0 m-0 border-0">
        <div className="p-3 sm:p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground flex items-center">
            <MapPin className="h-6 w-6 mr-2 text-red-500" />
            Venues Nearby
          </h1>
        </div>
        <div className="p-0 sm:p-6">
          <div className="space-y-6">
            {venues.map((venue) => (
              <div key={venue.id} className="border border-border rounded-none lg:rounded-lg overflow-hidden hover:shadow-md transition-shadow p-0 m-0">
                <img
                  src={venue.image}
                  alt={venue.name}
                  className="w-full h-48 object-cover rounded-none lg:rounded-lg m-0"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-1 text-foreground">{venue.name}</h3>
                  <p className="text-muted-foreground mb-3">{venue.type} Venue</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {venue.address}
                    </span>
                    <span className="flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      {venue.rating} stars
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <p><strong>Phone:</strong> {venue.phone}</p>
                    <p><strong>Hours:</strong> {venue.hours}</p>
                    <p><strong>Distance:</strong> {venue.distance}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1">View Details</Button>
                    <Button className="flex-1">Contact</Button>
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
