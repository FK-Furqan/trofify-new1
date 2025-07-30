import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";

interface ProfileCompletionIndicatorProps {
  completionPercentage: number;
  className?: string;
  showDetails?: boolean;
}

export const ProfileCompletionIndicator: React.FC<ProfileCompletionIndicatorProps> = ({
  completionPercentage,
  className = "",
  showDetails = false
}) => {
  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="h-4 w-4" />;
    if (percentage >= 50) return <Circle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const getStatusText = (percentage: number) => {
    if (percentage >= 80) return "Complete";
    if (percentage >= 50) return "Good";
    return "Incomplete";
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-3 ${className}`}>
      {/* Circular Progress */}
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
          {/* Background circle */}
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${completionPercentage}, 100`}
            className={getStatusColor(completionPercentage)}
            strokeLinecap="round"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-semibold ${getStatusColor(completionPercentage)}`}>
            {Math.round(completionPercentage)}%
          </span>
        </div>
      </div>

      {/* Status info */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center space-x-2">
          {getStatusIcon(completionPercentage)}
          <span className={`text-sm font-medium ${getStatusColor(completionPercentage)}`}>
            Profile {getStatusText(completionPercentage)}
          </span>
        </div>
        {showDetails && (
          <span className="text-xs text-gray-500 dark:text-gray-400 break-words">
            {completionPercentage < 100 ? "Complete your profile to unlock more features" : "Profile is complete!"}
          </span>
        )}
      </div>

      {/* Progress bar (alternative view) */}
      {showDetails && (
        <div className="w-full sm:flex-1 min-w-0">
          <Progress value={completionPercentage} className="h-2" />
        </div>
      )}
    </div>
  );
};

// Hook to calculate profile completion percentage
export const useProfileCompletion = (userData: any, userType: string) => {
  const calculateCompletion = () => {
    if (!userData) return 0;

    let totalFields = 0;
    let completedFields = 0;

    // Base user fields (always required)
    const baseFields = ['display_name', 'email'];
    totalFields += baseFields.length;
    completedFields += baseFields.filter(field => userData[field]).length;

    // Type-specific fields
    switch (userType) {
      case 'athlete':
        const athleteFields = ['full_name', 'sport', 'position', 'team', 'location'];
        totalFields += athleteFields.length;
        completedFields += athleteFields.filter(field => userData[field]).length;
        break;

      case 'coach':
        const coachFields = ['full_name', 'sport', 'experience_level', 'certifications', 'location'];
        totalFields += coachFields.length;
        completedFields += coachFields.filter(field => userData[field]).length;
        break;

      case 'venue':
        const venueFields = ['owner_name', 'venue_name', 'venue_type', 'address', 'city', 'state', 'zip_code', 'website', 'capacity', 'facilities', 'description'];
        totalFields += venueFields.length;
        completedFields += venueFields.filter(field => userData[field]).length;
        break;

      case 'media_creator':
        const mediaFields = ['full_name', 'media_type', 'specialization', 'experience', 'portfolio_url', 'social_media_handles', 'equipment', 'location', 'description'];
        totalFields += mediaFields.length;
        completedFields += mediaFields.filter(field => userData[field]).length;
        break;

      case 'organization_institute':
        const orgFields = ['contact_name', 'organization_name', 'organization_type', 'website', 'address', 'city', 'state', 'zip_code', 'founded_year', 'mission_statement', 'programs_services', 'target_audience', 'description'];
        totalFields += orgFields.length;
        completedFields += orgFields.filter(field => userData[field]).length;
        break;

      case 'sports_brand':
        const brandFields = ['contact_name', 'brand_name', 'company_type', 'website', 'address', 'city', 'state', 'zip_code', 'product_categories', 'target_markets', 'description'];
        totalFields += brandFields.length;
        completedFields += brandFields.filter(field => userData[field]).length;
        break;

      case 'fan':
        const fanFields = ['full_name', 'favorite_sports', 'favorite_teams', 'interests', 'location'];
        totalFields += fanFields.length;
        completedFields += fanFields.filter(field => userData[field]).length;
        break;

      default:
        break;
    }

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  };

  return calculateCompletion();
}; 