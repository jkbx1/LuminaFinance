import React from "react";

export const LuminaLogo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <svg 
      viewBox="0 0 256 256" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="256" height="256" rx="56" fill="none" />

      {/* Red accent part stays red */}
      <rect x="144" y="56" width="48" height="72" rx="6" fill="#FF004D" filter="url(#neon-glow)" />
      <rect x="144" y="56" width="48" height="72" rx="6" fill="#FF004D" />

      {/* Parts that should be theme-aware (White in Dark, Black in Light) */}
      <path 
        d="M 48 104 Q 128 128 208 104" 
        stroke="var(--text-bright)"
        strokeWidth="12" 
        strokeLinecap="round" 
      />

      <path 
        d="M 48 104 Q 128 128 208 104 L 208 176 C 208 193.6 193.6 208 176 208 L 80 208 C 62.4 208 48 193.6 48 176 Z" 
        stroke="var(--text-bright)"
        strokeWidth="12" 
        strokeLinejoin="round" 
      />
      
      <circle cx="72" cy="180" r="4" fill="var(--text-bright)" />
      <circle cx="92" cy="180" r="4" fill="var(--text-bright)" />
      <circle cx="112" cy="180" r="4" fill="var(--text-bright)" />
    </svg>
  );
};
