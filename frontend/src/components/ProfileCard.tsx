'use client';
import React, { useState, useEffect } from 'react';
import {
  Mail,
  Briefcase,
  ChevronRight,
  Sparkles,
  Settings,
  LogOut,
  History,
  X,
  User,
  FolderOpen,
  Shield,
  Clock,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileCardProps {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  projectCount?: number;
  onViewProfile?: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
  onHistory?: () => void;
  className?: string;
}

// Custom curve SVG for the header
const HeaderCurve = () => (
  <svg
    viewBox="0 0 100 20"
    preserveAspectRatio="none"
    className="absolute bottom-0 left-0 w-full h-8 text-white fill-current translate-y-[99%]"
  >
    <path d="M0,0 C50,25 100,0 100,0 L100,20 L0,20 Z" />
  </svg>
);

export function ProfileCard({
  name,
  email,
  role,
  avatarUrl,
  projectCount = 0,
  onViewProfile,
  onLogout,
  onSettings,
  onHistory,
  className = '',
}: ProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const memberSince = new Date().toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) setIsExpanded(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  // Lock body scroll when expanded
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isExpanded]);

  const compactCard = (
    <motion.div
      layoutId="profile-card-container"
      className={`relative w-full max-w-sm rounded-[32px] overflow-hidden bg-white border border-[#c8d9e6] cursor-pointer shadow-sm hover:shadow-xl transition-shadow duration-300 ${className}`}
      onClick={() => onViewProfile ? onViewProfile() : setIsExpanded(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Header Gradient */}
      <motion.div
        layoutId="profile-card-header"
        className="relative h-24 w-full bg-gradient-to-r from-[#2f4156] to-[#7fa1b6]"
      >
        <HeaderCurve />
      </motion.div>

      <div className="relative px-6 pb-6 pt-10 flex flex-col items-center">
        {/* Avatar */}
        <motion.div
          layoutId="profile-card-avatar-container"
          className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-full p-[3px] bg-white shadow-md z-10"
        >
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#2f4156] border-2 border-white text-white overflow-hidden">
            {avatarUrl && !avatarUrl.includes('watermelon') ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif text-2xl font-semibold tracking-wide">
                {initials}
              </span>
            )}
            <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-white bg-emerald-400 z-10" />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div layoutId="profile-card-content" className="w-full text-center mt-2 flex flex-col items-center">
          <h3 className="font-serif text-[26px] font-bold text-[#2f4156] leading-tight">
            {name}
          </h3>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#f4f2f0] px-3 py-1 border border-gray-100">
            <Briefcase size={12} className="text-[#567c8d]" />
            <span className="text-xs font-semibold text-[#567c8d]">
              {role}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-[#738c9c]">
            <Mail size={14} className="text-[#a0bbc9]" />
            <span>{email}</span>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#e0e7ec] to-transparent my-5" />

          {/* Compact Stats */}
          <div className="flex w-full items-center justify-between px-2">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-bold text-[#2f4156]">
                {projectCount}
              </span>
              <span className="text-[10px] font-bold tracking-widest text-[#738c9c] uppercase">
                Projects
              </span>
            </div>
            <div className="h-8 w-px bg-[#e0e7ec]" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="flex items-center gap-1 text-lg font-bold text-[#2f4156]">
                <Sparkles size={14} className="text-[#a0bbc9]" />
                AI
              </span>
              <span className="text-[10px] font-bold tracking-widest text-[#738c9c] uppercase">
                Powered
              </span>
            </div>
            <div className="h-8 w-px bg-[#e0e7ec]" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-lg font-bold text-[#2f4156]">
                {memberSince.split(' ')[0]} {memberSince.split(' ')[1]}
              </span>
              <span className="text-[10px] font-bold tracking-widest text-[#738c9c] uppercase">
                Member Since
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-center text-[#a0bbc9]">
            <ChevronUp size={20} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  const expandedCard = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6"
      onClick={() => setIsExpanded(false)}
    >
      <motion.div
        layoutId="profile-card-container"
        className="relative w-full max-w-sm rounded-[32px] overflow-hidden bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsExpanded(false)}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header Gradient */}
        <motion.div
          layoutId="profile-card-header"
          className="relative h-28 w-full bg-gradient-to-r from-[#2f4156] to-[#7fa1b6]"
        >
          <HeaderCurve />
        </motion.div>

        <div className="relative px-6 pb-6 pt-12 flex flex-col items-center">
          {/* Avatar */}
          <motion.div
            layoutId="profile-card-avatar-container"
            className="absolute -top-14 left-1/2 -translate-x-1/2 rounded-full p-[4px] bg-white shadow-md z-10"
          >
            <div className="relative flex h-[104px] w-[104px] items-center justify-center rounded-full bg-[#2f4156] border-2 border-white text-white overflow-hidden">
              {avatarUrl && !avatarUrl.includes('watermelon') ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-4xl font-semibold tracking-wide">
                  {initials}
                </span>
              )}
              <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full border-[3px] border-white bg-emerald-400 z-10" />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div layoutId="profile-card-content" className="w-full text-center mt-2 flex flex-col items-center">
            <h3 className="font-serif text-[28px] font-bold text-[#2f4156] leading-tight">
              {name}
            </h3>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#f4f2f0] px-4 py-1.5 border border-gray-100">
              <Briefcase size={14} className="text-[#567c8d]" />
              <span className="text-sm font-semibold text-[#567c8d]">
                {role}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-[15px] text-[#738c9c]">
              <Mail size={16} className="text-[#a0bbc9]" />
              <span>{email}</span>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#e0e7ec] to-transparent my-6" />

            {/* Stats */}
            <div className="flex w-full items-center justify-between px-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl font-bold text-[#2f4156]">
                  {projectCount}
                </span>
                <span className="text-[11px] font-bold tracking-widest text-[#738c9c] uppercase">
                  Projects
                </span>
              </div>
              <div className="h-10 w-px bg-[#e0e7ec]" />
              <div className="flex flex-col items-center gap-1">
                <span className="flex items-center gap-1.5 text-xl font-bold text-[#2f4156]">
                  <Sparkles size={16} className="text-[#a0bbc9]" />
                  AI
                </span>
                <span className="text-[11px] font-bold tracking-widest text-[#738c9c] uppercase">
                  Powered
                </span>
              </div>
              <div className="h-10 w-px bg-[#e0e7ec]" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl font-bold text-[#2f4156]">
                  {memberSince.split(' ')[0]} {memberSince.split(' ')[1]}
                </span>
                <span className="text-[11px] font-bold tracking-widest text-[#738c9c] uppercase">
                  Member Since
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-center text-[#a0bbc9] rotate-180 mb-2">
              <ChevronUp size={20} />
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="w-full mt-4"
            >
              <h4 className="text-left text-[11px] font-bold tracking-[0.15em] text-[#567c8d] mb-4">
                QUICK ACTIONS
              </h4>
              <div className="flex flex-col gap-2.5">
                {onViewProfile && (
                  <button
                    type="button"
                    onClick={() => { setIsExpanded(false); onViewProfile(); }}
                    className="flex w-full items-center gap-3 rounded-2xl bg-[#f4f2f0] px-5 py-3.5 text-[15px] font-semibold text-[#2f4156] transition-all hover:bg-gray-100 active:scale-[0.98]"
                  >
                    <ChevronRight size={18} className="text-[#a0bbc9]" />
                    <span>View Full Profile</span>
                  </button>
                )}
                {onHistory && (
                  <button
                    type="button"
                    onClick={() => { setIsExpanded(false); onHistory(); }}
                    className="flex w-full items-center gap-3 rounded-2xl bg-[#f4f2f0] px-5 py-3.5 text-[15px] font-semibold text-[#2f4156] transition-all hover:bg-gray-100 active:scale-[0.98]"
                  >
                    <History size={18} className="text-[#a0bbc9]" />
                    <span>Analysis History</span>
                  </button>
                )}
                {onSettings && (
                  <button
                    type="button"
                    onClick={() => { setIsExpanded(false); onSettings(); }}
                    className="flex w-full items-center gap-3 rounded-2xl bg-[#f4f2f0] px-5 py-3.5 text-[15px] font-semibold text-[#2f4156] transition-all hover:bg-gray-100 active:scale-[0.98]"
                  >
                    <Settings size={18} className="text-[#a0bbc9]" />
                    <span>Settings</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => { setIsExpanded(false); onLogout(); }}
                    className="flex w-full items-center gap-3 rounded-2xl bg-[#f4f2f0] px-5 py-3.5 text-[15px] font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-[0.98]"
                  >
                    <LogOut size={18} className="text-red-400" />
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <>
      <div className={className}>
        {compactCard}
      </div>
      <AnimatePresence>
        {isExpanded && expandedCard}
      </AnimatePresence>
    </>
  );
}
