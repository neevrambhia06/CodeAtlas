'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import { TimedUndoAction } from '@/components/TimedUndoAction';
import { BackButton } from '@/components/BackButton';

export default function HistoryPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [repos, setRepos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<{ jobId: string; title: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [jobsRes, reposRes] = await Promise.all([
          fetch(`${API_BASE_URL}/repositories/jobs`, { headers }).catch(() => null),
          fetch(`${API_BASE_URL}/repositories/`, { headers }).catch(() => null)
        ]);
        
        if (jobsRes && reposRes && jobsRes.ok && reposRes.ok) {
          const jobsData = await jobsRes.json();
          const reposData = await reposRes.json();
          
          const repoMap: Record<string, string> = {};
          reposData.repositories?.forEach((r: any) => {
            repoMap[r.repo_id] = r.name;
          });
          
          setRepos(repoMap);
          setJobs(jobsData.jobs || []);
        }
      } catch {
        // Silently handle offline/network errors
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const initiateDelete = (jobId: string, title: string) => {
    setPendingDelete({ jobId, title });
  };

  const confirmDelete = async (jobId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/repositories/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null);

      if (res && res.ok) {
        setJobs((prev) => prev.filter((j) => j.job_id !== jobId));
        if (localStorage.getItem('activeJobId') === jobId) {
          localStorage.removeItem('activeJobId');
        }
      }
    } catch {
      // Handle error
    } finally {
      setPendingDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-pulse bg-[#FFFFFF] w-full max-w-7xl h-96 rounded-[24px] border border-[#C8D9E6] shadow-sm" />
      </div>
    );
  }

  const activeJobsList = jobs.filter((j) => j.job_id !== pendingDelete?.jobId);

  return (
    <>
    <div className="w-full max-w-7xl mx-auto px-8 py-8 h-full flex flex-col animate-fade-in">
      <BackButton label="Back to Dashboard" href="/dashboard" className="mb-2" />
      <div className="mb-8 flex justify-between items-center">
        <h1 className="font-serif text-3xl font-bold text-[#2F4156]">Analysis History</h1>
      </div>

      <div className="bg-[#FFFFFF] border border-[#C8D9E6] rounded-[24px] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F5EFEB] border-b border-[#C8D9E6]">
              <th className="p-4 font-semibold text-[#567C8D] text-sm">Project Name</th>
              <th className="p-4 font-semibold text-[#567C8D] text-sm hidden sm:table-cell">Job ID</th>
              <th className="p-4 font-semibold text-[#567C8D] text-sm">Status</th>
              <th className="p-4 font-semibold text-[#567C8D] text-sm text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {activeJobsList.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-[#567C8D] font-medium">
                  No analyses found.
                </td>
              </tr>
            ) : (
              activeJobsList.map((job) => {
                const projectTitle = job.project_name || repos[job.repo_id] || 'Unnamed Project';
                return (
                  <tr key={job.job_id} className="border-b border-[#C8D9E6]/40 hover:bg-[#F5EFEB]/50 transition-colors">
                    <td className="p-4 font-semibold text-[#2F4156] truncate max-w-[220px]" title={projectTitle}>
                      {projectTitle}
                    </td>
                    <td className="p-4 font-mono text-xs text-[#567C8D] hidden sm:table-cell" title={job.job_id}>
                      {job.job_id.slice(0, 12)}...
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        job.status === 'Completed'
                          ? 'bg-[#567C8D]/15 text-[#2F4156] border border-[#C8D9E6]'
                          : job.status === 'Failed'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-[#C8D9E6]/30 text-[#2F4156] border border-[#C8D9E6]'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end items-center gap-4">
                      <Link
                        href={`/dashboard/project/${job.job_id}`}
                        onClick={() => localStorage.setItem('activeJobId', job.job_id)}
                        className="text-[#567C8D] hover:text-[#2F4156] hover:underline text-sm font-semibold transition"
                      >
                        View Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => initiateDelete(job.job_id, projectTitle)}
                        className="text-[#567C8D] hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        title="Delete Project"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
    
    {/* Timed Undo Action Overlay - placed outside animate-fade-in to avoid transform containment */}
    {pendingDelete && (
      <TimedUndoAction
        itemTitle={pendingDelete.title}
        durationSeconds={5}
        onConfirmDelete={() => confirmDelete(pendingDelete.jobId)}
        onCancelUndo={() => setPendingDelete(null)}
      />
    )}
    </>
  );
}
