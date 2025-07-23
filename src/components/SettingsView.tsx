import {
  User,
  Bell,
  Shield,
  Globe,
  Smartphone,
  CreditCard,
  ChevronRight,
  LogOut,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React from "react";

export const SettingsView = () => {
  const settingsCategories = [
    {
      id: "account",
      name: "Account Settings",
      icon: User,
      items: [
        {
          id: "edit-profile",
          name: "Edit Profile",
          description: "Update your personal information",
        },
        {
          id: "privacy-settings",
          name: "Privacy Settings",
          description: "Control who can see your content",
        },
        {
          id: "account-verification",
          name: "Account Verification",
          description: "Verify your athlete status",
        },
      ],
    },
    {
      id: "notifications",
      name: "Notifications",
      icon: Bell,
      items: [
        {
          id: "push-notifications",
          name: "Push Notifications",
          description: "Get notified about new activities",
        },
        {
          id: "email-notifications",
          name: "Email Notifications",
          description: "Receive updates via email",
        },
        { id: "sms-notifications", name: "SMS Notifications", description: "Get text message alerts" },
      ],
    },
    {
      id: "security",
      name: "Security",
      icon: Shield,
      items: [
        { id: "change-password", name: "Change Password", description: "Update your login password" },
        {
          id: "two-factor-authentication",
          name: "Two-Factor Authentication",
          description: "Add extra security to your account",
        },
        { id: "login-activity", name: "Login Activity", description: "See where you're logged in" },
      ],
    },
    {
      id: "preferences",
      name: "Preferences",
      icon: Globe,
      items: [
        { id: "language", name: "Language", description: "Choose your preferred language" },
        { id: "time-zone", name: "Time Zone", description: "Set your local time zone" },
        { id: "content-preferences", name: "Content Preferences", description: "Customize what you see" },
      ],
    },
  ];

  return (
    <div className="w-full lg:max-w-4xl lg:mx-auto lg:p-4">
      <div className="bg-card rounded-none lg:rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground mb-4">Settings</h1>

          {/* Profile Preview */}
          <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
            <Avatar className="h-16 w-16">
              <AvatarImage src={"/placeholder.svg"} onError={e => { e.currentTarget.src = "/placeholder.svg"; }} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">John Doe</h3>
              <p className="text-muted-foreground">Professional Football Player</p>
              <p className="text-sm text-muted-foreground">@johndoe_football</p>
            </div>
            <Button variant="outline" className="ml-auto">
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Settings Categories */}
        <div className="p-6">
          <div className="space-y-6">
            {settingsCategories.map((category) => (
              <div key={category.id} className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <category.icon className="h-5 w-5 mr-2" />
                  {category.name}
                </h2>
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-medium text-foreground">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Actions */}
        <div className="p-6 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Account Actions
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-muted rounded-lg">
                  <LogOut className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Sign Out</h3>
                  <p className="text-sm text-muted-foreground">
                    Sign out of your account
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-medium text-destructive">Delete Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and data
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
