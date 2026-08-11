'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  href?: string;
  className?: string;
}

export function BackButton({ label = 'Back', href, className = '' }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`back-btn ${className}`}
    >
      <ArrowLeft size={16} className="back-btn-icon" />
      <span>{label}</span>

      <style jsx>{`
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 12px;
          background: transparent;
          border: 1px solid transparent;
          color: #567c8d;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 4px;
        }
        .back-btn:hover {
          background: #f5efeb;
          border-color: #c8d9e6;
          color: #2f4156;
        }
        .back-btn:hover :global(.back-btn-icon) {
          transform: translateX(-3px);
        }
      `}</style>
    </button>
  );
}
