
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

interface SportsBrandSignupFormProps {
  onSuccess: (email: string) => void;
  onBack: () => void;
}

export const SportsBrandSignupForm = ({ onSuccess, onBack }: SportsBrandSignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    contactName: "",
    email: "",
    password: "",
    confirmPassword: "",
    brandName: "",
    companyType: "",
    website: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    productCategories: [] as string[],
    targetMarkets: [] as string[],
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const companyTypes = [
    "Sports Equipment Manufacturer", "Sportswear Brand", "Fitness Equipment",
    "Nutrition/Supplements", "Sports Technology", "Sports Media", "Other"
  ];

  const productCategories = [
    "Athletic Footwear", "Sportswear/Apparel", "Fitness Equipment", "Sports Gear",
    "Nutrition Products", "Sports Technology", "Sports Accessories", "Team Uniforms"
  ];

  const targetMarkets = [
    "Professional Athletes", "Amateur Athletes", "Youth Sports", "Fitness Enthusiasts",
    "Sports Teams", "Coaches/Trainers", "Sports Venues", "General Consumers"
  ];

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      productCategories: prev.productCategories.includes(category)
        ? prev.productCategories.filter(c => c !== category)
        : [...prev.productCategories, category]
    }));
  };

  const handleMarketToggle = (market: string) => {
    setFormData(prev => ({
      ...prev,
      targetMarkets: prev.targetMarkets.includes(market)
        ? prev.targetMarkets.filter(m => m !== market)
        : [...prev.targetMarkets, market]
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
          user_type: "sports_brand"
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setFormData({
          displayName: "",
          contactName: "",
          email: "",
          password: "",
          confirmPassword: "",
          brandName: "",
          companyType: "",
          website: "",
          phoneNumber: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          productCategories: [],
          targetMarkets: [],
          description: ""
        });
        toast({
          title: "Success!",
          description: "Sports brand account created successfully!",
          variant: "success"
        });
        onSuccess(formData.email);
      } else {
        setFormData({
          displayName: "",
          contactName: "",
          email: "",
          password: "",
          confirmPassword: "",
          brandName: "",
          companyType: "",
          website: "",
          phoneNumber: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          productCategories: [],
          targetMarkets: [],
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
        contactName: "",
        email: "",
        password: "",
        confirmPassword: "",
        brandName: "",
        companyType: "",
        website: "",
        phoneNumber: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        productCategories: [],
        targetMarkets: [],
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
          Sports brand account created successfully!
        </div>
      )}
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">Sports Brand Registration</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand-displayName">Display Name</Label>
            <Input
              id="brand-displayName"
              placeholder="Enter your display name"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-contactName">Contact Person Name</Label>
            <Input
              id="brand-contactName"
              placeholder="Enter contact person name"
              value={formData.contactName}
              onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand-email">Business Email</Label>
            <Input
              id="brand-email"
              type="email"
              placeholder="Enter business email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand-password">Password</Label>
            <div className="relative">
              <Input
                id="brand-password"
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
            <Label htmlFor="brand-confirmPassword">Confirm Password</Label>
            <Input
              id="brand-confirmPassword"
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
            <Label htmlFor="brand-brandName">Brand/Company Name</Label>
            <Input
              id="brand-brandName"
              placeholder="Enter brand name"
              value={formData.brandName}
              onChange={(e) => setFormData(prev => ({ ...prev, brandName: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-companyType">Company Type</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, companyType: value }))}>
              <SelectTrigger id="brand-companyType">
                <SelectValue placeholder="Select company type" />
              </SelectTrigger>
              <SelectContent>
                {companyTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand-website">Website</Label>
            <Input
              id="brand-website"
              type="url"
              placeholder="Enter website URL"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-phoneNumber">Phone Number</Label>
            <Input
              id="brand-phoneNumber"
              type="tel"
              placeholder="Enter phone number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand-address">Business Address</Label>
          <Input
            id="brand-address"
            placeholder="Enter street address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand-city">City</Label>
            <Input
              id="brand-city"
              placeholder="Enter city"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-state">State</Label>
            <Input
              id="brand-state"
              placeholder="Enter state"
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-zipCode">ZIP Code</Label>
            <Input
              id="brand-zipCode"
              placeholder="Enter ZIP code"
              value={formData.zipCode}
              onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Product Categories (Select all that apply)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {productCategories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={formData.productCategories.includes(category)}
                  onCheckedChange={() => handleCategoryToggle(category)}
                />
                <Label htmlFor={category} className="text-sm">{category}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Target Markets (Select all that apply)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {targetMarkets.map((market) => (
              <div key={market} className="flex items-center space-x-2">
                <Checkbox
                  id={market}
                  checked={formData.targetMarkets.includes(market)}
                  onCheckedChange={() => handleMarketToggle(market)}
                />
                <Label htmlFor={market} className="text-sm">{market}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand-description">Company Description</Label>
          <Textarea
            id="brand-description"
            placeholder="Describe your company, products, and what makes you unique..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <span className="animate-spin mr-2">🔄</span> : null}
          {loading ? "Creating Account..." : "Create Sports Brand Account"}
        </Button>
      </form>
    </div>
  );
};
