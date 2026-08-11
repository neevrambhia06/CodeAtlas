import React from 'react';

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  monochrome?: boolean;
}

export function LogoIcon({ size = 24, monochrome = false, className = '', ...props }: LogoIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* The A structure */}
      <path 
        d="M12 4 L4 20 M12 4 L20 20 M7 14 L17 14" 
        stroke={monochrome ? 'currentColor' : 'var(--color-brand-primary, #2F4156)'} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Internal complex graph */}
      <path 
        d="M12 4 L12 14 M7 14 L12 20 M17 14 L12 20" 
        stroke={monochrome ? 'currentColor' : 'var(--color-brand-secondary, #567C8D)'} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={monochrome ? '' : 'opacity-80'}
      />

      {/* Data nodes crossing the paths */}
      <circle cx="12" cy="4" r="2" fill={monochrome ? 'currentColor' : 'var(--color-brand-primary, #2F4156)'} />
      <circle cx="4" cy="20" r="1.5" fill={monochrome ? 'currentColor' : 'var(--color-brand-secondary, #567C8D)'} />
      <circle cx="20" cy="20" r="1.5" fill={monochrome ? 'currentColor' : 'var(--color-brand-secondary, #567C8D)'} />
      
      <circle cx="12" cy="14" r="1.5" fill={monochrome ? 'currentColor' : 'var(--color-brand-primary, #2F4156)'} />
      <circle cx="7" cy="14" r="1.5" fill={monochrome ? 'currentColor' : 'var(--color-brand-secondary, #567C8D)'} />
      <circle cx="17" cy="14" r="1.5" fill={monochrome ? 'currentColor' : 'var(--color-brand-secondary, #567C8D)'} />
      <circle cx="12" cy="20" r="1.5" fill={monochrome ? 'currentColor' : 'var(--color-brand-primary, #2F4156)'} />
    </svg>
  );
}
