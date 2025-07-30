import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { ProfileCompletionIndicator, useProfileCompletion } from "./ProfileCompletionIndicator";
import { getBackendUrl } from "@/lib/utils";

interface EditProfileFormProps {
  userData: any;
  userType: string;
  onProfileUpdated?: () => void;
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({
  userData,
  userType,
  onProfileUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const { toast } = useToast();

  const completionPercentage = useProfileCompletion(userData, userType);

  useEffect(() => {
    if (userData) {
      setFormData(userData);
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${getBackendUrl()}/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType,
          profileData: formData
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully!",
          variant: "success"
        });
        onProfileUpdated?.();
      } else {
        toast({
          title: "Update Failed",
          description: data.error || "Failed to update profile",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Network Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderVenueForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium">Street Address</Label>
          <Input
            id="address"
            placeholder="Enter street address"
            value={formData.address || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="h-12 text-sm rounded-lg w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website" className="text-sm font-medium">Website</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://your-venue.com"
            value={formData.website || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            className="h-12 text-sm rounded-lg w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium">City</Label>
          <Input
            id="city"
            placeholder="Enter city"
            value={formData.city || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className="h-12 text-sm rounded-lg w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state" className="text-sm font-medium">State</Label>
          <Input
            id="state"
            placeholder="Enter state"
            value={formData.state || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
            className="h-12 text-sm rounded-lg w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode" className="text-sm font-medium">ZIP Code</Label>
          <Input
            id="zipCode"
            placeholder="Enter ZIP code"
            value={formData.zip_code || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
            className="h-12 text-sm rounded-lg w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity" className="text-sm font-medium">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          placeholder="Maximum capacity (number of people)"
          value={formData.capacity || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
          className="h-12 text-sm rounded-lg w-full"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Available Facilities</Label>
        <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto scrollbar-hide p-3 border rounded-lg bg-muted/20">
          {[
            "Parking", "Locker Rooms", "Equipment Rental", "Pro Shop",
            "Cafeteria/Snack Bar", "First Aid", "Wi-Fi", "Air Conditioning",
            "Spectator Seating", "Audio/Visual Equipment", "Lighting", "Accessibility Features"
          ].map((facility) => (
            <div key={facility} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox
                id={facility}
                checked={(formData.facilities || "").includes(facility)}
                onCheckedChange={(checked) => {
                  const currentFacilities = (formData.facilities || "").split(',').filter(f => f.trim());
                  if (checked) {
                    setFormData(prev => ({ 
                      ...prev, 
                      facilities: [...currentFacilities, facility].join(',') 
                    }));
                  } else {
                    setFormData(prev => ({ 
                      ...prev, 
                      facilities: currentFacilities.filter(f => f !== facility).join(',') 
                    }));
                  }
                }}
                className="rounded"
              />
              <Label htmlFor={facility} className="text-sm cursor-pointer flex-1 font-medium">{facility}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your venue, services offered, special features..."
          value={formData.description || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="text-sm resize-none rounded-lg"
        />
      </div>
    </div>
  );

  const renderMediaCreatorForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="specialization" className="text-sm font-medium">Specialization</Label>
          <Select 
            value={formData.specialization || ""} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, specialization: value }))}
          >
            <SelectTrigger className="h-12 text-sm rounded-lg">
              <SelectValue placeholder="Select your specialization" />
            </SelectTrigger>
            <SelectContent>
              {[
                "Sports Photography", "Action Photography", "Portrait Photography",
                "Event Coverage", "Documentary", "Commercial", "Editorial",
                "Social Media Content", "YouTube Content", "TikTok Content",
                "Sports Analysis", "Live Commentary", "Interview", "Other"
              ].map((spec) => (
                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="experience" className="text-sm font-medium">Experience Level</Label>
          <Select 
            value={formData.experience || ""} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}
          >
            <SelectTrigger className="h-12 text-sm rounded-lg">
              <SelectValue placeholder="Select your experience level" />
            </SelectTrigger>
            <SelectContent>
              {["Beginner", "Intermediate", "Advanced", "Professional", "Expert"].map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="portfolioUrl" className="text-sm font-medium">Portfolio URL</Label>
        <Input
          id="portfolioUrl"
          type="url"
          placeholder="https://your-portfolio.com"
          value={formData.portfolio_url || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
          className="h-12 text-sm rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="socialMediaHandles" className="text-sm font-medium">Social Media Handles</Label>
        <Input
          id="socialMediaHandles"
          placeholder="Instagram: @username, Twitter: @username, etc."
          value={formData.social_media_handles || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, social_media_handles: e.target.value }))}
          className="h-12 text-sm rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="equipment" className="text-sm font-medium">Equipment/Skills</Label>
        <Input
          id="equipment"
          placeholder="Camera models, software, special skills..."
          value={formData.equipment || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
          className="h-12 text-sm rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm font-medium">Location</Label>
        <Input
          id="location"
          placeholder="Enter your city/state"
          value={formData.location || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          className="h-12 text-sm rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">About You</Label>
        <Textarea
          id="description"
          placeholder="Tell us about your work, style, and what you bring to the sports community..."
          value={formData.description || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="text-sm resize-none rounded-lg"
        />
      </div>
    </div>
  );

  const renderOrganizationForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="website" className="text-sm font-medium">Website</Label>
        <Input
          id="website"
          type="url"
          placeholder="https://your-organization.com"
          value={formData.website || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
          className="h-12 text-sm rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-sm font-medium">Address</Label>
        <Input
          id="address"
          placeholder="Enter street address"
          value={formData.address || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className="h-12 text-sm rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium">City</Label>
          <Input
            id="city"
            placeholder="Enter city"
            value={formData.city || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className="h-12 text-sm rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state" className="text-sm font-medium">State</Label>
          <Input
            id="state"
            placeholder="Enter state"
            value={formData.state || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
            className="h-12 text-sm rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode" className="text-sm font-medium">ZIP Code</Label>
          <Input
            id="zipCode"
            placeholder="Enter ZIP code"
            value={formData.zip_code || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
            className="h-12 text-sm rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="foundedYear" className="text-sm font-medium">Founded Year</Label>
        <Select 
          value={formData.founded_year || ""} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, founded_year: value }))}
        >
          <SelectTrigger className="h-12 text-sm rounded-lg">
            <SelectValue placeholder="Select founded year" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetAudience" className="text-sm font-medium">Target Audience</Label>
        <Select 
          value={formData.target_audience || ""} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, target_audience: value }))}
        >
          <SelectTrigger className="h-12 text-sm rounded-lg">
            <SelectValue placeholder="Select target audience" />
          </SelectTrigger>
          <SelectContent>
            {[
              "Youth (Under 18)", "College Students", "Professional Athletes", "Amateur Athletes",
              "General Public", "Students", "Coaches", "Trainers", "Sports Enthusiasts",
              "Recreational Players", "Elite Athletes", "All Ages", "Other"
            ].map((audience) => (
              <SelectItem key={audience} value={audience}>{audience}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="missionStatement" className="text-sm font-medium">Mission Statement</Label>
        <Textarea
          id="missionStatement"
          placeholder="Describe your organization's mission and goals..."
          value={formData.mission_statement || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, mission_statement: e.target.value }))}
          rows={3}
          className="text-sm resize-none rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="programsServices" className="text-sm font-medium">Programs & Services</Label>
        <Textarea
          id="programsServices"
          placeholder="Describe the programs, services, or activities your organization offers..."
          value={formData.programs_services || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, programs_services: e.target.value }))}
          rows={3}
          className="text-sm resize-none rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">About Your Organization</Label>
        <Textarea
          id="description"
          placeholder="Tell us more about your organization, its history, and what makes it unique..."
          value={formData.description || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="text-sm resize-none rounded-lg"
        />
      </div>
    </div>
  );

  const renderFormByType = () => {
    switch (userType) {
      case 'venue':
        return renderVenueForm();
      case 'media_creator':
        return renderMediaCreatorForm();
      case 'organization_institute':
        return renderOrganizationForm();
      default:
        return <div>Profile editing for this user type is not yet implemented.</div>;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-2 sm:p-4 lg:p-6 overflow-x-hidden">
      <Card className="border-0 shadow-none rounded-xl">
        <CardHeader className="pb-4 px-3 sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg sm:text-xl">Edit Profile</CardTitle>
              <CardDescription className="text-sm">
                Complete your profile to unlock more features and improve your visibility
              </CardDescription>
            </div>
            <div className="flex-shrink-0">
              <ProfileCompletionIndicator 
                completionPercentage={completionPercentage} 
                showDetails={true}
                className="justify-center"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-3 sm:px-6 overflow-x-hidden">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="flex w-full h-12 bg-transparent border-b border-border">
                <TabsTrigger 
                  value="profile" 
                  className="flex items-center justify-center text-sm px-2 sm:px-4 py-2 font-medium transition-all data-[state=active]:text-[#0e9591] data-[state=active]:border-b-2 data-[state=active]:border-[#0e9591] data-[state=inactive]:text-muted-foreground hover:text-[#0e9591] relative"
                >
                  Profile Details
                </TabsTrigger>
                <TabsTrigger 
                  value="additional" 
                  className="flex items-center justify-center text-sm px-2 sm:px-4 py-2 font-medium transition-all data-[state=active]:text-[#0e9591] data-[state=active]:border-b-2 data-[state=active]:border-[#0e9591] data-[state=inactive]:text-muted-foreground hover:text-[#0e9591] relative"
                >
                  Additional Information
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
                    <Input
                      id="displayName"
                      placeholder="Enter your display name"
                      value={formData.display_name || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      className="h-12 text-sm rounded-lg w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email || ""}
                      disabled
                      className="h-12 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg w-full"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="additional" className="mt-4">
                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                  {renderFormByType()}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-12 rounded-lg">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto h-12 rounded-lg">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}; 