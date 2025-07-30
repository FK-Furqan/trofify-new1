import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getBackendUrl } from "@/lib/utils";

interface MediaCreatorSignupFormProps {
  onSuccess: (email: string) => void;
  onBack: () => void;
}

export const MediaCreatorSignupForm = ({ onSuccess, onBack }: MediaCreatorSignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    mediaType: "",
    phoneNumber: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const mediaTypes = [
    "Photography", "Videography", "Content Creation", "Social Media Management",
    "Sports Journalism", "Podcasting", "Blogging", "Live Streaming",
    "Graphic Design", "Animation", "Film Making", "Digital Marketing",
    "Sports Analysis", "Commentary", "Other"
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
          user_type: "media_creator"
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
          mediaType: "",
          phoneNumber: ""
        });
        toast({
          title: "Success!",
          description: "Media Creator account created successfully! Complete your profile to get started.",
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
          mediaType: "",
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
        mediaType: "",
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
          Media Creator account created successfully!
        </div>
      )}
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">Media Creator Registration</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="media-displayName">Display Name</Label>
            <Input
              id="media-displayName"
              placeholder="Enter your display name"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="media-fullName">Full Name</Label>
            <Input
              id="media-fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="media-email">Email</Label>
            <Input
              id="media-email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media-password">Password</Label>
            <div className="relative">
              <Input
                id="media-password"
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
            <Label htmlFor="media-confirmPassword">Confirm Password</Label>
            <Input
              id="media-confirmPassword"
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
            <Label htmlFor="media-mediaType">Media Type</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, mediaType: value }))}>
              <SelectTrigger id="media-mediaType">
                <SelectValue placeholder="Select your media type" />
              </SelectTrigger>
              <SelectContent>
                {mediaTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="media-phoneNumber">Phone Number</Label>
            <Input
              id="media-phoneNumber"
              type="tel"
              placeholder="Enter phone number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Quick Setup:</strong> You can add your specialization, experience, portfolio, social media handles, and other details in your profile after signing up.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <span className="animate-spin mr-2">🔄</span> : null}
          {loading ? "Creating Account..." : "Create Media Creator Account"}
        </Button>
      </form>
    </div>
  );
}; 