import React from 'react';

export const CodeAtlasLoader = ({ className = '', text = 'Loading...' }: { className?: string, text?: string }) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-12 ${className}`}>
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Neoleaf Inspired Animation */}
        <div className="absolute inset-0 flex items-center justify-center animate-spin-slow">
          <div className="leaf leaf-1 bg-[#2F4156]/80"></div>
          <div className="leaf leaf-2 bg-[#567C8D]/80"></div>
          <div className="leaf leaf-3 bg-[#A4B8C4]/80"></div>
          <div className="leaf leaf-4 bg-[#C8D9E6]/80"></div>
        </div>

        {/* Inner Glow */}
        <div className="absolute inset-0 bg-[#FFFFFF] blur-xl rounded-full scale-75 opacity-70"></div>
        
        {/* CodeAtlas SVG Logo (Static or gently pulsing in center) */}
        <div className="relative z-10 animate-pulse-slow">
          <svg viewBox="0 0 24 24" className="w-16 h-16 drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoPrimary" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2F4156" />
                <stop offset="100%" stopColor="#2F4156" />
              </linearGradient>
            </defs>
            <path 
              d="M12 4 L4 20 M12 4 L20 20 M7 14 L17 14 M12 4 L12 14 M7 14 L12 20 M17 14 L12 20" 
              stroke="url(#logoPrimary)" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <g>
              <circle cx="12" cy="4" r="1.5" fill="#2F4156" />
              <circle cx="4" cy="20" r="1.5" fill="#2F4156" />
              <circle cx="20" cy="20" r="1.5" fill="#2F4156" />
              <circle cx="12" cy="14" r="1.5" fill="#2F4156" />
              <circle cx="7" cy="14" r="1.5" fill="#2F4156" />
              <circle cx="17" cy="14" r="1.5" fill="#2F4156" />
              <circle cx="12" cy="20" r="1.5" fill="#2F4156" />
            </g>
          </svg>
        </div>
      </div>

      <div className="text-[#2F4156] font-semibold tracking-widest uppercase text-sm animate-pulse flex items-center gap-2">
        {text}
        <span className="flex space-x-1">
          <span className="w-1 h-1 bg-[#567C8D] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
          <span className="w-1 h-1 bg-[#567C8D] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          <span className="w-1 h-1 bg-[#567C8D] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
        </span>
      </div>

      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse 3s ease-in-out infinite;
        }

        .leaf {
          position: absolute;
          width: 50px;
          height: 50px;
          border-radius: 100% 0 100% 0; /* Creates the leaf shape */
          mix-blend-mode: multiply;
          transform-origin: center center;
          animation: morphLeaf 4s ease-in-out infinite alternate;
        }

        .leaf-1 {
          transform: rotate(0deg) translate(25px, -25px);
          animation-delay: 0s;
        }
        .leaf-2 {
          transform: rotate(90deg) translate(25px, -25px);
          animation-delay: -1s;
        }
        .leaf-3 {
          transform: rotate(180deg) translate(25px, -25px);
          animation-delay: -2s;
        }
        .leaf-4 {
          transform: rotate(270deg) translate(25px, -25px);
          animation-delay: -3s;
        }

        @keyframes morphLeaf {
          0% {
            border-radius: 100% 0 100% 0;
            transform: scale(1) rotate(var(--rotation)) translate(20px, -20px);
          }
          50% {
            border-radius: 50% 50% 50% 50%;
            transform: scale(0.8) rotate(var(--rotation)) translate(30px, -30px);
          }
          100% {
            border-radius: 0 100% 0 100%;
            transform: scale(1.1) rotate(var(--rotation)) translate(15px, -15px);
          }
        }
        
        .leaf-1 { --rotation: 0deg; }
        .leaf-2 { --rotation: 90deg; }
        .leaf-3 { --rotation: 180deg; }
        .leaf-4 { --rotation: 270deg; }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
