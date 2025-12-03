import React from 'react';
import { cn } from '@/lib/utils';

interface CircularTooltipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: React.ReactNode;
  isActive?: boolean;
}

const CircularTooltip = ({ label, children, isActive, className, ...props }: CircularTooltipProps) => {
  // Generate a unique ID for the SVG path to avoid conflicts
  const uniqueId = `circlePath-${React.useId().replace(/:/g, "")}`;
  
  return (
    <button className={cn("tooltip", className)} data-active={isActive} {...props}>
      <div className="tooltip__content">
        {children}
      </div>
      <svg className="tooltip__label" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <path id={uniqueId} d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" />
        </defs>
        <text fill="var(--color-text)">
          <textPath href={`#${uniqueId}`} startOffset="50%">
            {label}
          </textPath>
        </text>
      </svg>
    </button>
  );
};

export default CircularTooltip;