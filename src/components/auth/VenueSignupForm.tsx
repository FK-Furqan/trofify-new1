
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getBackendUrl } from "@/lib/utils";

interface VenueSignupFormProps {
  onSuccess: (email: string) => void;
  onBack: () => void;
}

export const VenueSignupForm = ({ onSuccess, onBack }: VenueSignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
    venueName: "",
    venueType: "",
    phoneNumber: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const venueTypes = [
    "Gym/Fitness Center", "Sports Stadium", "Swimming Pool", "Tennis Court",
    "Basketball Court", "Soccer Field", "Baseball Field", "Golf Course",
    "Boxing Gym", "Martial Arts Dojo", "Dance Studio", "Other"
  ];

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
          user_type: "venue"
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setFormData({
          displayName: "",
          ownerName: "",
          email: "",
          password: "",
          confirmPassword: "",
          venueName: "",
          venueType: "",
          phoneNumber: ""
        });
        toast({
          title: "Success!",
          description: "Venue account created successfully! Complete your profile to get started.",
          variant: "success"
        });
        onSuccess(formData.email);
      } else {
        setFormData({
          displayName: "",
          ownerName: "",
          email: "",
          password: "",
          confirmPassword: "",
          venueName: "",
          venueType: "",
          phoneNumber: ""
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
        ownerName: "",
        email: "",
        password: "",
        confirmPassword: "",
        venueName: "",
        venueType: "",
        phoneNumber: ""
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
        <div className="mb-4 p-3 rounded bg-green-600 text-white text-center font-semibold">
          Venue account created successfully!
        </div>
      )}
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">Venue Registration</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="venue-displayName">Display Name</Label>
            <Input
              id="venue-displayName"
              placeholder="Enter display name for your venue"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue-ownerName">Owner Name</Label>
            <Input
              id="venue-ownerName"
              placeholder="Enter owner's full name"
              value={formData.ownerName}
              onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="venue-email">Email</Label>
            <Input
              id="venue-email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue-password">Password</Label>
            <div className="relative">
              <Input
                id="venue-password"
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
            <Label htmlFor="venue-confirmPassword">Confirm Password</Label>
            <Input
              id="venue-confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="venue-venueName">Venue Name</Label>
            <Input
              id="venue-venueName"
              placeholder="Enter venue name"
              value={formData.venueName}
              onChange={(e) => setFormData(prev => ({ ...prev, venueName: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue-venueType">Venue Type</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, venueType: value }))}>
              <SelectTrigger id="venue-venueType">
                <SelectValue placeholder="Select venue type" />
              </SelectTrigger>
              <SelectContent>
                {venueTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="venue-phoneNumber">Phone Number</Label>
          <Input
            id="venue-phoneNumber"
            type="tel"
            placeholder="Enter phone number"
            value={formData.phoneNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            required
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Quick Setup:</strong> You can complete your venue details, address, facilities, and other information in your profile after signing up.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <span className="animate-spin mr-2">🔄</span> : null}
          {loading ? "Creating Account..." : "Create Venue Account"}
        </Button>
      </form>
    </div>
  );
};
