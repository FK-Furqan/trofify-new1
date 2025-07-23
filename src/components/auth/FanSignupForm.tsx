
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getBackendUrl } from "@/lib/utils";

interface FanSignupFormProps {
  onSuccess: (email: string) => void;
  onBack: () => void;
}

export const FanSignupForm = ({ onSuccess, onBack }: FanSignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    favoriteSports: [] as string[],
    favoriteTeams: "",
    location: "",
    phoneNumber: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const sports = [
    "Football", "Basketball", "Tennis", "Swimming", "Running", "Cycling",
    "Golf", "Baseball", "Soccer", "Volleyball", "Boxing", "Wrestling",
    "Gymnastics", "Track & Field", "CrossFit", "Martial Arts"
  ];

  const handleSportToggle = (sport: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteSports: prev.favoriteSports.includes(sport)
        ? prev.favoriteSports.filter(s => s !== sport)
        : [...prev.favoriteSports, sport]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords don't match!",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    setSuccess(false);
    try {
      const response = await fetch(`${getBackendUrl()}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          user_type: "fan"
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setFormData({
          displayName: "",
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
          favoriteSports: [],
          favoriteTeams: "",
          location: "",
          phoneNumber: "",
          description: ""
        });
        toast({
          title: "Success!",
          description: "Fan account created successfully!",
          variant: "success"
        });
        onSuccess(formData.email);
      } else {
        setFormData({
          displayName: "",
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
          favoriteSports: [],
          favoriteTeams: "",
          location: "",
          phoneNumber: "",
          description: ""
        });
        toast({
          title: "Signup Failed",
          description: data.error || "Signup failed",
          variant: "destructive"
        });
      }
    } catch (err) {
      setFormData({
        displayName: "",
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        favoriteSports: [],
        favoriteTeams: "",
        location: "",
        phoneNumber: "",
        description: ""
      });
      toast({
        title: "Network Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={loading ? "opacity-50 pointer-events-none transition-opacity duration-300" : "transition-opacity duration-300"}>
      {success && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-800 text-center font-semibold">
          Fan account created successfully!
        </div>
      )}
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">Sports Fan Registration</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fan-displayName">Display Name</Label>
            <Input
              id="fan-displayName"
              placeholder="Enter your display name"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fan-fullName">Full Name</Label>
            <Input
              id="fan-fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fan-email">Email</Label>
            <Input
              id="fan-email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fan-password">Password</Label>
            <div className="relative">
              <Input
                id="fan-password"
                type={showPassword ? "text" : "password"}
                placeholder="Create password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fan-confirmPassword">Confirm Password</Label>
            <Input
              id="fan-confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fan-location">Location</Label>
            <Input
              id="fan-location"
              placeholder="Enter your city/state"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fan-phoneNumber">Phone Number (Optional)</Label>
            <Input
              id="fan-phoneNumber"
              type="tel"
              placeholder="Enter phone number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Favorite Sports (Select all that apply)</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {sports.map((sport) => (
              <div key={sport} className="flex items-center space-x-2">
                <Checkbox
                  id={sport}
                  checked={formData.favoriteSports.includes(sport)}
                  onCheckedChange={() => handleSportToggle(sport)}
                />
                <Label htmlFor={sport} className="text-sm">{sport}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fan-favoriteTeams">Favorite Teams/Athletes</Label>
          <Input
            id="fan-favoriteTeams"
            placeholder="e.g., Lakers, Tom Brady, Serena Williams..."
            value={formData.favoriteTeams}
            onChange={(e) => setFormData(prev => ({ ...prev, favoriteTeams: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fan-description">Description</Label>
          <Textarea
            id="fan-description"
            placeholder="Tell us about yourself as a sports fan..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <span className="animate-spin mr-2">🔄</span> : null}
          {loading ? "Creating Account..." : "Create Fan Account"}
        </Button>
      </form>
    </div>
  );
};
