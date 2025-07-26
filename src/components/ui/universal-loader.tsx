import React from 'react';

interface UniversalLoaderProps {
  count?: number;
  className?: string;
  type?: 'conversation' | 'default';
}

export const UniversalLoader: React.FC<UniversalLoaderProps> = ({ 
  count = 3, 
  className = "",
  type = "default"
}) => {
  if (type === 'conversation') {
    return (
      <div className={`space-y-1 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-4 animate-pulse">
            {/* Avatar skeleton */}
            <div className="w-12 h-12 bg-muted rounded-full flex-shrink-0"></div>
            
            {/* Content skeleton */}
            <div className="flex-1 min-w-0">
              {/* Name and timestamp row */}
              <div className="flex items-center justify-between mb-1">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-3 bg-muted rounded w-8"></div>
              </div>
              
              {/* Message preview and badge row */}
              <div className="flex items-center justify-between">
                <div className="h-3 bg-muted rounded w-32 flex-1 mr-2"></div>
                <div className="h-5 bg-muted rounded-full w-16 flex-shrink-0"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default loader (for other components)
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-muted rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-24 mb-1"></div>
              <div className="h-3 bg-muted rounded w-16"></div>
            </div>
          </div>
          <div className="h-4 bg-muted rounded w-full mb-2"></div>
          <div className="h-40 bg-muted rounded w-full"></div>
        </div>
      ))}
    </div>
  );
};

export default UniversalLoader; 