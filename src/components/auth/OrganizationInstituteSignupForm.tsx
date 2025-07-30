import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getBackendUrl } from "@/lib/utils";

interface OrganizationInstituteSignupFormProps {
  onSuccess: (email: string) => void;
  onBack: () => void;
}

export const OrganizationInstituteSignupForm = ({ onSuccess, onBack }: OrganizationInstituteSignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    contactName: "",
    organizationName: "",
    email: "",
    password: "",
    confirmPassword: "",
    organizationType: "",
    phoneNumber: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const organizationTypes = [
    "Sports Club", "Training Academy", "University/College", "High School",
    "Sports Federation", "Athletic Association", "Fitness Center", "Sports Complex",
    "Youth Organization", "Community Center", "Sports Foundation", "Research Institute",
    "Sports Medicine Center", "Recreation Center", "Sports League", "Other"
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
          user_type: "organization_institute"
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setFormData({
          displayName: "",
          contactName: "",
          organizationName: "",
          email: "",
          password: "",
          confirmPassword: "",
          organizationType: "",
          phoneNumber: ""
        });
        toast({
          title: "Success!",
          description: "Organization/Institute account created successfully! Complete your profile to get started.",
          variant: "success"
        });
        onSuccess(formData.email);
      } else {
        setFormData({
          displayName: "",
          contactName: "",
          organizationName: "",
          email: "",
          password: "",
          confirmPassword: "",
          organizationType: "",
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
        contactName: "",
        organizationName: "",
        email: "",
        password: "",
        confirmPassword: "",
        organizationType: "",
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
          Organization/Institute account created successfully!
        </div>
      )}
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">Organization/Institute Registration</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="org-displayName">Display Name</Label>
            <Input
              id="org-displayName"
              placeholder="Enter display name for your organization"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-contactName">Contact Person Name</Label>
            <Input
              id="org-contactName"
              placeholder="Enter contact person's full name"
              value={formData.contactName}
              onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-organizationName">Organization Name</Label>
          <Input
            id="org-organizationName"
            placeholder="Enter your organization's full name"
            value={formData.organizationName}
            onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="org-email">Email</Label>
            <Input
              id="org-email"
              type="email"
              placeholder="Enter organization email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-password">Password</Label>
            <div className="relative">
              <Input
                id="org-password"
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
            <Label htmlFor="org-confirmPassword">Confirm Password</Label>
            <Input
              id="org-confirmPassword"
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
            <Label htmlFor="org-organizationType">Organization Type</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, organizationType: value }))}>
              <SelectTrigger id="org-organizationType">
                <SelectValue placeholder="Select organization type" />
              </SelectTrigger>
              <SelectContent>
                {organizationTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-phoneNumber">Phone Number</Label>
            <Input
              id="org-phoneNumber"
              type="tel"
              placeholder="Enter organization phone number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Quick Setup:</strong> You can add your address, website, mission statement, programs, and other details in your profile after signing up.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <span className="animate-spin mr-2">🔄</span> : null}
          {loading ? "Creating Account..." : "Create Organization/Institute Account"}
        </Button>
      </form>
    </div>
  );
}; 