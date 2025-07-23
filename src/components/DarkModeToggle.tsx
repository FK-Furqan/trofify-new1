import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDarkMode } from './DarkModeProvider';

interface DarkModeToggleProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ 
  className = '', 
  variant = 'ghost',
  size = 'icon'
}) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleDarkMode}
      className={className}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}; 