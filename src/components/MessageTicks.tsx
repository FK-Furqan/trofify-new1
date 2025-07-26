import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

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
        return 'text-[#2e3a3f] font-semibold'; // Dark color for read messages
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
        return <CheckCheck className="h-3 w-3" />; // Double tick
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