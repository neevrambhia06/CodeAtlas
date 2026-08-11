import React from 'react';
import { LogoIcon } from './LogoIcon';

interface LogoProps {
  size?: number;
  monochrome?: boolean;
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ size = 24, monochrome = false, className = '', iconOnly = false }: LogoProps) {
  // Use a proportional font size based on the icon size
  const fontSize = Math.max(16, size * 0.9);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon size={size} monochrome={monochrome} className="shrink-0" />
      {!iconOnly && (
        <span 
          className={`font-heading font-bold tracking-tight ${monochrome ? 'text-inherit' : 'text-primary'}`}
          style={{ fontSize }}
        >
          CodeAtlas
        </span>
      )}
    </div>
  );
}
