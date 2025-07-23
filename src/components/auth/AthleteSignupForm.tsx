
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AthleteSignupFormProps {
  onSuccess: (email: string) => void;
  onBack: () => void;
}

export const AthleteSignupForm = ({ onSuccess, onBack }: AthleteSignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    sport: "",
    level: "",
    achievements: "",
    dateOfBirth: "",
    location: "",
    phoneNumber: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const sports = [
    "Football", "Basketball", "Tennis", "Swimming", "Running", "Cycling",
    "Golf", "Baseball", "Soccer", "Volleyball", "Boxing", "Wrestling",
    "Gymnastics", "Track & Field", "CrossFit", "Martial Arts", "Other"
  ];

  const levels = [
    "Beginner", "Amateur", "Semi-Professional", "Professional", "Elite"
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
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          user_type: "athlete"
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
          sport: "",
          level: "",
          achievements: "",
          dateOfBirth: "",
          location: "",
          phoneNumber: ""
        });
        toast({
          title: "Success!",
          description: "Athlete account created successfully!",
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
          sport: "",
          level: "",
          achievements: "",
          dateOfBirth: "",
          location: "",
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
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        sport: "",
        level: "",
        achievements: "",
        dateOfBirth: "",
        location: "",
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
          Athlete account created successfully!
        </div>
      )}
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">Athlete Registration</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="athlete-displayName">Display Name</Label>
            <Input
              id="athlete-displayName"
              placeholder="Enter your display name"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="athlete-fullName">Full Name</Label>
            <Input
              id="athlete-fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="athlete-email">Email</Label>
            <Input
              id="athlete-email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="athlete-password">Password</Label>
            <div className="relative">
              <Input
                id="athlete-password"
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
            <Label htmlFor="athlete-confirmPassword">Confirm Password</Label>
            <Input
              id="athlete-confirmPassword"
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
            <Label htmlFor="athlete-sport">Primary Sport</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, sport: value }))}>
              <SelectTrigger id="athlete-sport">
                <SelectValue placeholder="Select your sport" />
              </SelectTrigger>
              <SelectContent>
                {sports.map((sport) => (
                  <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="athlete-level">Competition Level</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
              <SelectTrigger id="athlete-level">
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="athlete-dateOfBirth">Date of Birth</Label>
            <Input
              id="athlete-dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="athlete-phoneNumber">Phone Number</Label>
            <Input
              id="athlete-phoneNumber"
              type="tel"
              placeholder="Enter phone number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="athlete-location">Location</Label>
          <Input
            id="athlete-location"
            placeholder="Enter your city/state"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="athlete-achievements">Achievements (Optional)</Label>
          <Textarea
            id="athlete-achievements"
            placeholder="Tell us about your achievements, records, or notable performances..."
            value={formData.achievements}
            onChange={(e) => setFormData(prev => ({ ...prev, achievements: e.target.value }))}
            rows={3}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <span className="animate-spin mr-2">🔄</span> : null}
          {loading ? "Creating Account..." : "Create Athlete Account"}
        </Button>
      </form>
    </div>
  );
};
