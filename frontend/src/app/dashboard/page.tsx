'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import React from 'react';
import { API_BASE_URL } from '@/lib/api';
import { SplitButton } from '@/components/SplitButton';
import { Sparkles } from 'lucide-react';

export default function DashboardHome() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const token = hashParams.get('access_token');
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', hashParams.get('role') || 'Developer');
        localStorage.setItem('name', hashParams.get('name') || '');
        localStorage.setItem('email', hashParams.get('email') || '');
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    setName(localStorage.getItem('name') || 'User');
    setRole(localStorage.getItem('role') || 'Developer');
    setEmail(localStorage.getItem('email') || '');

    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/repositories/jobs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json();
          setJobs(data.jobs || []);
        }
      } catch {
        // Silently handle offline/network errors
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleProjectAction = (jobId: string, path: string) => {
    localStorage.setItem('activeJobId', jobId);
    router.push(path);
  };

  const completedJobs = jobs.filter(j => j.status === 'Completed').reverse();

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-pulse bg-[#FFFFFF] w-full max-w-7xl h-96 rounded-[24px] border border-[#C8D9E6] shadow-sm" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 w-full animate-fade-in">
      {/* Hero Tagline Section */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#2F4156] p-10 md:p-14 shadow-sm border border-[#2F4156]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Welcome back, {name}.
            </h1>
            <p className="text-[#C8D9E6] text-base md:text-lg font-medium max-w-lg">
              Let&apos;s make sense of your software.
            </p>
          </div>

          <div className="flex-shrink-0">
            <SplitButton
              onSelect={(source) => router.push(`/dashboard/upload?tab=${source}`)}
              className="relative z-10"
            />
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-[#2F4156] font-serif tracking-tight">Your Projects</h2>
        </div>

        {completedJobs.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center border border-dashed border-[#C8D9E6] rounded-[24px] p-16 bg-[#FFFFFF] shadow-sm">
            <div className="w-16 h-16 bg-[#F5EFEB] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#C8D9E6]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#2F4156]">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#2F4156] mb-2 font-serif">No projects found</h3>
            <p className="text-[#567C8D] mb-8 text-center max-w-md font-light">Upload a repository to let our AI reasoning engine construct its knowledge graph and business logic map.</p>
            <Link
              href="/dashboard/upload"
              className="bg-[#2F4156] text-[#FFFFFF] px-8 py-3 rounded-full hover:bg-[#1F2D3D] transition-colors font-medium shadow-md"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {completedJobs.map((job) => (
              <div key={job.job_id} className="bg-[#FFFFFF] border border-[#C8D9E6] rounded-[20px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(47,65,86,0.05)] hover:border-[#567C8D] transition-all duration-300 relative group overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                  <div>
                    <h3 className="text-xl font-bold text-[#2F4156] font-serif mb-2 group-hover:text-[#567C8D] transition-colors">{job.project_name || job.repo_id || 'Unnamed Project'}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#567C8D] font-light">
                      <span className="flex items-center gap-1.5 bg-[#F5EFEB] px-2.5 py-1 rounded border border-[#C8D9E6]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#567C8D]"></span>
                        Analyzed
                      </span>
                      <span className="text-[#C8D9E6]">|</span>
                      <span className="font-mono text-xs bg-[#F5EFEB] px-2 py-1 rounded border border-[#C8D9E6]">ID: {job.job_id.slice(0, 12)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleProjectAction(job.job_id, `/dashboard/project/${job.job_id}`)} 
                    className="bg-[#2F4156] text-white px-6 py-2.5 rounded-full font-medium hover:bg-[#1F2D3D] transition shadow-md whitespace-nowrap self-stretch sm:self-auto flex justify-center items-center gap-2"
                  >
                    View Project
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
