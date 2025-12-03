import React from 'react';
import { cn } from '@/lib/utils';

interface HoverTooltipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: React.ReactNode;
  isActive?: boolean;
}

const HoverTooltip = ({ label, children, isActive, className, ...props }: HoverTooltipProps) => {
  return (
    <button
      className={cn(
        "overflow-x-visible relative w-14 h-14 overflow-y-clip group text-center",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex justify-center items-center w-14 h-14 rounded-full bg-primary transition-all duration-300 absolute top-0 group-hover:scale-[.60] group-hover:origin-top text-primary-foreground",
          isActive && "ring-2 ring-offset-2 ring-primary ring-offset-background"
        )}
      >
        {children}
      </div>
      <div
        className="absolute text-foreground font-bold -bottom-10 left-1/2 text-sm text-center whitespace-nowrap transition-all duration-300 transform -translate-x-1/2 group-hover:bottom-0"
      >
        {label}
      </div>
    </button>
  );
};

export default HoverTooltip;