'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Logo } from '@/components/Logo';
import { ProfileCard } from '@/components/ProfileCard';
import { API_BASE_URL } from '@/lib/api';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('role');
      const userName = localStorage.getItem('name') || '';
      const userEmail = localStorage.getItem('email') || '';
      const userAvatarUrl = localStorage.getItem('avatarUrl') || '';
      
      if (token && userRole) {
        setRole(userRole);
        setName(userName);
        setEmail(userEmail);
        setAvatarUrl(userAvatarUrl);
        // Fetch project count for the profile hover card
        fetch(`${API_BASE_URL}/repositories/jobs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.jobs) {
              setProjectCount(data.jobs.filter((j: any) => j.status === 'Completed').length);
            }
          })
          .catch(() => {});
      } else {
        setRole(null);
        setName('');
        setEmail('');
        setAvatarUrl('');
      }
    };

    checkAuth();

    // Re-check shortly after mount to catch OAuth redirects
    // where dashboard useEffect writes to localStorage after Navbar mounts
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    setRole(null);
    router.push('/');
  };

  const userInitial = name ? name.charAt(0).toUpperCase() : 'P';
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <header className="w-full bg-[var(--color-bg-surface)] border-b border-[var(--color-border-subtle)] shadow-sm z-50">
      <nav className="w-full px-6 py-4 flex justify-between items-center max-w-[1400px] mx-auto">
        
        {/* Left: Logo */}
        <div className="flex-shrink-0 flex items-center">
          <Link href="/">
            <Logo size={24} />
          </Link>
        </div>
        
        {/* Center: Dashboard Navigation (if applicable) */}
        {isDashboard && role && (
          <div className="hidden lg:flex flex-1 justify-center items-center gap-1 mx-4 overflow-x-auto no-scrollbar">
            <Link href="/" className="px-4 py-2 text-sm text-[var(--color-brand-secondary)] rounded-full hover:bg-[var(--color-bg-base)] hover:text-[var(--color-brand-primary)] font-semibold transition-colors whitespace-nowrap">Home</Link>
            <Link href="/dashboard" className="px-4 py-2 text-sm text-[var(--color-brand-secondary)] rounded-full hover:bg-[var(--color-bg-base)] hover:text-[var(--color-brand-primary)] font-semibold transition-colors whitespace-nowrap">Overview</Link>
            <Link href="/dashboard/upload" className="px-4 py-2 text-sm text-[var(--color-brand-secondary)] rounded-full hover:bg-[var(--color-bg-base)] hover:text-[var(--color-brand-primary)] font-semibold transition-colors whitespace-nowrap">Upload</Link>
            <Link href="/dashboard/history" className="px-4 py-2 text-sm text-[var(--color-brand-secondary)] rounded-full hover:bg-[var(--color-bg-base)] hover:text-[var(--color-brand-primary)] font-semibold transition-colors whitespace-nowrap">History</Link>
          </div>
        )}

        {/* Right: Auth / Profile */}
        <div className="flex gap-4 items-center flex-shrink-0">
          {!role ? (
            <>
              <Link href="/login" className="text-[var(--color-brand-secondary)] hover:text-[var(--color-brand-primary)] transition-colors font-medium text-sm">Sign In</Link>
              <Link href="/register" className="btn-primary px-5 py-2 text-sm rounded-full">Get Started</Link>
            </>
          ) : (
            <>
              {!isDashboard && (
                <span className="text-xs bg-[var(--color-bg-base)] text-[var(--color-brand-secondary)] px-3 py-1 rounded-full border border-[var(--color-border-subtle)] font-medium hidden md:inline-block">Role: {role}</span>
              )}
              {!isDashboard && <Link href="/dashboard" className="text-[var(--color-brand-secondary)] hover:text-[var(--color-brand-primary)] font-medium text-sm transition-colors hidden sm:block">Dashboard</Link>}

              <div className="relative group">
                <button
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-brand-secondary)]/15 text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)] hover:text-[var(--color-bg-surface)] transition-colors font-bold text-sm border border-[var(--color-border-subtle)] overflow-hidden"
                  title="Your Profile"
                >
                  {avatarUrl && !avatarUrl.includes('watermelon') ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    userInitial
                  )}
                </button>
                
                {/* Profile Hover Card - full ProfileCard dropdown */}
                <div className="absolute right-0 top-full pt-3 w-[380px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100 z-[100] pointer-events-none group-hover:pointer-events-auto">
                  <ProfileCard
                    name={name || 'User'}
                    email={email}
                    role={role}
                    avatarUrl={avatarUrl}
                    projectCount={projectCount}
                    onViewProfile={() => router.push('/profile')}
                    onHistory={() => router.push('/dashboard/history')}
                    onSettings={() => router.push('/settings')}
                    onLogout={handleLogout}
                    className="w-full shadow-2xl"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
