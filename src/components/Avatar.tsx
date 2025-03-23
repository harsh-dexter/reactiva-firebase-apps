
import React from 'react';
import { Avatar as ShadcnAvatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AvatarProps {
  username: string;
  color: string;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  username, 
  color, 
  isOnline = false, 
  size = 'md', 
  className 
}) => {
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base'
  };

  return (
    <div className="relative">
      <ShadcnAvatar className={cn(sizeClasses[size], className)}>
        <AvatarFallback style={{ backgroundColor: color }}>
          {getInitials(username)}
        </AvatarFallback>
      </ShadcnAvatar>
      {isOnline && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
      )}
    </div>
  );
};

export default Avatar;
