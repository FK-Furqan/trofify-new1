
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Heart, MapPin, Building, Camera, GraduationCap } from "lucide-react";
import { UserCategory } from "../AuthSystem";

interface SignupCategorySelectionProps {
  onSelectCategory: (category: UserCategory) => void;
}

export const SignupCategorySelection = ({ onSelectCategory }: SignupCategorySelectionProps) => {
  const categories = [
    {
      id: "athlete" as UserCategory,
      title: "Athlete",
      description: "Professional or amateur sports person",
      icon: Trophy,
      color: "from-blue-500 to-blue-600"
    },
    {
      id: "coach" as UserCategory,
      title: "Coach/Trainer",
      description: "Sports coach, trainer, or instructor",
      icon: Users,
      color: "from-green-500 to-green-600"
    },
    {
      id: "fan" as UserCategory,
      title: "Sports Fan",
      description: "Sports enthusiast and supporter",
      icon: Heart,
      color: "from-red-500 to-red-600"
    },
    {
      id: "venue" as UserCategory,
      title: "Venue Owner",
      description: "Sports facility or venue owner",
      icon: MapPin,
      color: "from-purple-500 to-purple-600"
    },
    {
      id: "sports_brand" as UserCategory,
      title: "Sports Brand",
      description: "Sports equipment or clothing brand",
      icon: Building,
      color: "from-orange-500 to-orange-600"
    },
    {
      id: "media_creator" as UserCategory,
      title: "Media/Creator",
      description: "Content creator, photographer, or sports media",
      icon: Camera,
      color: "from-pink-500 to-pink-600"
    },
    {
      id: "organization_institute" as UserCategory,
      title: "Organization/Institute",
      description: "Sports organization, school, or training institute",
      icon: GraduationCap,
      color: "from-indigo-500 to-indigo-600"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2 text-white">Choose Your Category</h3>
        <p className="text-sm text-gray-300">Select the option that best describes you</p>
      </div>
      
      <div className="grid gap-3">
        {categories.map((category) => (
          <Card 
            key={category.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectCategory(category.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                  <category.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{category.title}</h4>
                  <p className="text-sm text-gray-300">{category.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
