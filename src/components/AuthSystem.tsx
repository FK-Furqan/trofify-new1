
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./auth/LoginForm";
import { SignupCategorySelection } from "./auth/SignupCategorySelection";
import { AthleteSignupForm } from "./auth/AthleteSignupForm";
import { CoachSignupForm } from "./auth/CoachSignupForm";
import { FanSignupForm } from "./auth/FanSignupForm";
import { VenueSignupForm } from "./auth/VenueSignupForm";
import { SportsBrandSignupForm } from "./auth/SportsBrandSignupForm";
import { MediaCreatorSignupForm } from "./auth/MediaCreatorSignupForm";
import { OrganizationInstituteSignupForm } from "./auth/OrganizationInstituteSignupForm";
import { Trophy } from "lucide-react";

export type UserCategory = "athlete" | "coach" | "fan" | "venue" | "sports_brand" | "media_creator" | "organization_institute";

interface AuthSystemProps {
  onAuthSuccess: (email?: string) => void;
}

export const AuthSystem = ({ onAuthSuccess }: AuthSystemProps) => {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [selectedCategory, setSelectedCategory] = useState<UserCategory | null>(null);

  const renderSignupForm = () => {
    switch (selectedCategory) {
      case "athlete":
        return <AthleteSignupForm onSuccess={(email) => onAuthSuccess(email)} onBack={() => setSelectedCategory(null)} />;
      case "coach":
        return <CoachSignupForm onSuccess={(email) => onAuthSuccess(email)} onBack={() => setSelectedCategory(null)} />;
      case "fan":
        return <FanSignupForm onSuccess={(email) => onAuthSuccess(email)} onBack={() => setSelectedCategory(null)} />;
      case "venue":
        return <VenueSignupForm onSuccess={(email) => onAuthSuccess(email)} onBack={() => setSelectedCategory(null)} />;
      case "sports_brand":
        return <SportsBrandSignupForm onSuccess={(email) => onAuthSuccess(email)} onBack={() => setSelectedCategory(null)} />;
      case "media_creator":
        return <MediaCreatorSignupForm onSuccess={(email) => onAuthSuccess(email)} onBack={() => setSelectedCategory(null)} />;
      case "organization_institute":
        return <OrganizationInstituteSignupForm onSuccess={(email) => onAuthSuccess(email)} onBack={() => setSelectedCategory(null)} />;
      default:
        return <SignupCategorySelection onSelectCategory={setSelectedCategory} />;
    }
  };

  return (
    <>
      {/* Desktop: Two-column layout */}
      <div className="auth-system-2col min-h-screen bg-background items-center justify-center p-0 hidden md:flex">
        <div className="auth-system-2col__container flex w-full max-w-6xl bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          {/* Left: Logo */}
          <div className="auth-system-2col__logo flex-1 flex flex-col items-center justify-center bg-muted p-8">
            <img
              src="/Trofify Logo.png?v=2"
              alt="Trofify Logo"
              className="w-60 h-60 object-contain mb-4"
            />
          </div>
          {/* Right: Auth Card */}
          <div className="auth-system-2col__form flex-1 flex flex-col justify-center p-8">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>{authMode === "login" ? "Welcome Back" : "Join Trofify"}</CardTitle>
                <CardDescription>
                  {authMode === "login" 
                    ? "Sign in to your account to continue" 
                    : "Create your account to get started"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {authMode === "login" ? (
                  <LoginForm onSuccess={onAuthSuccess} />
                ) : (
                  renderSignupForm()
                )}
                <div className="text-center mt-2">
                  <Button
                    variant="link"
                    onClick={() => {
                      setAuthMode(authMode === "login" ? "signup" : "login");
                      setSelectedCategory(null);
                    }}
                    className="text-sm mt-0"
                  >
                    {authMode === "login" 
                      ? (
                        <span>
                          Don't have an account?{' '}
                          <span className="text-[#0e9591] underline font-semibold">Sign up</span>
                        </span>
                      )
                      : (
                        <span>
                          Already have an account?{' '}
                          <span className="text-[#0e9591] underline font-semibold">Sign in</span>
                        </span>
                      )
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Mobile: Stacked layout */}
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-0 md:hidden">
        <div className="text-center mb-2">
          <img
                          src="/Trofify Logo.png?v=2"
              alt="Trofify Logo"
            className="w-64 h-64 object-contain mx-auto mb-1"
          />
        </div>
        <div className="w-full max-w-md px-2">
          <Card>
            <CardHeader className="text-center">
                              <CardTitle>{authMode === "login" ? "Welcome Back" : "Join Trofify"}</CardTitle>
              <CardDescription>
                {authMode === "login" 
                  ? "Sign in to your account to continue" 
                  : "Create your account to get started"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authMode === "login" ? (
                <LoginForm onSuccess={onAuthSuccess} />
              ) : (
                renderSignupForm()
              )}
              <div className="text-center mt-2">
                <Button
                  variant="link"
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "signup" : "login");
                    setSelectedCategory(null);
                  }}
                  className="text-sm mt-0"
                >
                  {authMode === "login" 
                    ? (
                      <span>
                        Don't have an account?{' '}
                        <span className="text-[#0e9591] underline font-semibold">Sign up</span>
                      </span>
                    )
                    : (
                      <span>
                        Already have an account?{' '}
                        <span className="text-[#0e9591] underline font-semibold">Sign in</span>
                      </span>
                    )
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
