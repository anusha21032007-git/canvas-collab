import React from 'react';
import { cn } from '@/lib/utils';

interface IconTooltipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: React.ReactNode;
  toolName: string;
  isActive?: boolean;
}

const IconTooltip = ({ label, children, toolName, isActive, className, ...props }: IconTooltipProps) => {
  return (
    <div className="icon-content">
      <button
        data-tool={toolName}
        className={cn(isActive && "active", className)}
        {...props}
      >
        <div className="filled"></div>
        {children}
      </button>
      <div className="tooltip">{label}</div>
    </div>
  );
};

export default IconTooltip;