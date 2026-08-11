'use client';
import React, { useState } from 'react';
import { GitBranch, FileArchive, ChevronRight, Plus } from 'lucide-react';

interface SplitButtonProps {
  activeTab?: 'zip' | 'git';
  onSelect: (option: 'zip' | 'git') => void;
  className?: string;
}

export function SplitButton({ activeTab = 'zip', onSelect, className = '' }: SplitButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelect = (option: 'zip' | 'git') => {
    onSelect(option);
    setIsExpanded(true);
  };

  return (
    <div className={`inline-flex items-center justify-center relative ${className}`}>
      {!isExpanded ? (
        /* Collapsed state — Single split-style button */
        <div className="inline-flex items-center rounded-full p-1 bg-[#FFFFFF] border border-[#C8D9E6] shadow-[0_4px_16px_rgba(47,65,86,0.08)] hover:border-[#567C8D] transition-all duration-300 group">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#2F4156] text-[#FFFFFF] font-semibold text-sm tracking-wide hover:bg-[#1F2D3D] transition-colors"
          >
            <Plus size={16} className="text-[#C8D9E6]" />
            <span>Add New Project</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            title="Split to choose source"
            className="flex items-center justify-center w-9 h-9 rounded-full text-[#567C8D] hover:bg-[#F5EFEB] hover:text-[#2F4156] transition-colors ml-1"
          >
            <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      ) : (
        /* Split state — Two distinct animated buttons */
        <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-[#F5EFEB] border border-[#C8D9E6] shadow-md animate-fade-in transition-all duration-300">
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#567C8D] pl-3 hidden sm:inline-block">
            Source:
          </span>

          <div className="flex items-center gap-2">
            {/* Option 1: GitHub */}
            <button
              type="button"
              onClick={() => handleSelect('git')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 shadow-sm ${
                activeTab === 'git'
                  ? 'bg-[#2F4156] text-[#FFFFFF] ring-2 ring-[#C8D9E6]'
                  : 'bg-[#FFFFFF] text-[#2F4156] border border-[#C8D9E6] hover:bg-[#C8D9E6]/30'
              }`}
            >
              <GitBranch size={14} className={activeTab === 'git' ? 'text-[#C8D9E6]' : 'text-[#567C8D]'} />
              <span>GitHub Repo</span>
            </button>

            {/* Option 2: ZIP */}
            <button
              type="button"
              onClick={() => handleSelect('zip')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 shadow-sm ${
                activeTab === 'zip'
                  ? 'bg-[#2F4156] text-[#FFFFFF] ring-2 ring-[#C8D9E6]'
                  : 'bg-[#FFFFFF] text-[#2F4156] border border-[#C8D9E6] hover:bg-[#C8D9E6]/30'
              }`}
            >
              <FileArchive size={14} className={activeTab === 'zip' ? 'text-[#C8D9E6]' : 'text-[#567C8D]'} />
              <span>ZIP File</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
