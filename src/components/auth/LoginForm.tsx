
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getBackendUrl } from "@/lib/utils";

interface LoginFormProps {
  onSuccess: (email: string) => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Remove guest login logic
    try {
      const response = await fetch(`${getBackendUrl()}/signup/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        onSuccess(formData.email); // Pass email to parent
      } else {
        toast({
          title: "Login Failed",
          description: data.error || "Invalid email or password.",
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

  return (
    <form onSubmit={handleSubmit} className={loading ? "space-y-4 opacity-50 pointer-events-none transition-opacity duration-300" : "space-y-4 transition-opacity duration-300"}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
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

      <Button type="submit" className="w-full" style={{ backgroundColor: '#0e9591', color: '#fff' }} disabled={loading}>
        {loading ? <span className="animate-spin mr-2">🔄</span> : null}
        {loading ? "Signing In..." : "Sign In"}
      </Button>

      {/* Guest Login Button for Demo Purposes */}
      {/* Removed the 'Login as Guest' button */}

      <div className="text-center">
        <Button variant="link" className="text-sm">
          Forgot your password?
        </Button>
      </div>
    </form>
  );
};
