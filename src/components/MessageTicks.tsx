import React from 'react';
import { Check } from 'lucide-react';

interface MessageTicksProps {
  deliveryStatus: 'sent' | 'delivered' | 'read';
  isOwnMessage: boolean;
}

export const MessageTicks: React.FC<MessageTicksProps> = ({ deliveryStatus, isOwnMessage }) => {
  if (!isOwnMessage) {
    return null; // Don't show ticks for received messages
  }

  const getTicksColor = () => {
    switch (deliveryStatus) {
      case 'read':
        return 'text-[#45bfbb] font-semibold'; // Teal color for read messages
      case 'delivered':
        return 'text-gray-200'; // Light gray for delivered (more visible than gray-300)
      case 'sent':
        return 'text-gray-400'; // Gray for sent
      default:
        return 'text-gray-400';
    }
  };

  const getTicksIcon = () => {
    switch (deliveryStatus) {
      case 'read':
      case 'delivered':
        return (
          <div className="relative">
            <Check className="h-3 w-3" />
            <Check className="h-3 w-3 absolute -bottom-0.5 -right-0.5" />
          </div>
        ); // Custom double tick positioned like WhatsApp
      case 'sent':
        return <Check className="h-3 w-3" />; // Single tick
      default:
        return <Check className="h-3 w-3" />;
    }
  };

  return (
    <div className={`flex items-center ${getTicksColor()}`}>
      {getTicksIcon()}
    </div>
  );
}; 