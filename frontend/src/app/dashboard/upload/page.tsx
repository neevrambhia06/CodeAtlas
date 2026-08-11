'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import { SplitButton } from '@/components/SplitButton';
import { BackButton } from '@/components/BackButton';

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'zip' | 'git'>('zip');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'git' || tabParam === 'zip') {
      setTab(tabParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (tab === 'zip' && !file) {
      setError('Please select a ZIP file.');
      return;
    }
    if (tab === 'git' && !url) {
      setError('Please enter a Git URL.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('analysis_type', 'full');
    if (projectName) formData.append('project_name', projectName);
    
    if (tab === 'zip' && file) {
      formData.append('file', file);
    } else if (tab === 'git') {
      formData.append('repository_url', url);
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/repositories/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMessage = data.error?.message || data.detail || 'Upload failed';
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      router.push(`/dashboard/upload/progress/${data.job_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 w-full max-w-3xl mx-auto">
      <div className="w-full flex justify-start mb-4">
        <BackButton label="Back to Dashboard" href="/dashboard" />
      </div>
      <div className="mb-10 text-center flex flex-col items-center">
        <h1 className="heading-display text-3xl font-bold text-[#2F4156] mb-3">Upload Repository</h1>
        <p className="text-[#567C8D] mb-6">Select your source type below to begin automated Software Reasoning analysis.</p>
        
        {/* Animated Split Button */}
        <SplitButton activeTab={tab} onSelect={(selectedTab) => setTab(selectedTab)} className="mb-2" />
      </div>
      
      <div className="card-premium overflow-hidden bg-[#FFFFFF] border border-[#C8D9E6] rounded-[24px] shadow-sm">
        <div className="p-8 lg:p-12">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 border border-red-200 font-medium text-sm">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#2F4156] mb-2">Project Name (Optional)</label>
              <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g., Core Banking API" className="w-full px-5 py-3 rounded-xl border border-[#C8D9E6] focus:ring-2 focus:ring-[#567C8D] focus:border-[#567C8D] outline-none transition bg-[#F5EFEB] text-[#2F4156]" disabled={loading} />
            </div>
            
            {tab === 'zip' ? (
              <div className="border-2 border-dashed border-[#C8D9E6] hover:border-[#567C8D] transition-colors rounded-2xl p-16 text-center bg-[#F5EFEB] group">
                <input type="file" accept=".zip" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" disabled={loading} />
                <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
                  <div className="w-16 h-16 bg-[#FFFFFF] text-[#567C8D] group-hover:text-[#2F4156] rounded-full flex items-center justify-center mx-auto mb-6 text-2xl border border-[#C8D9E6] shadow-sm transition-colors">📁</div>
                  <div className="text-[#2F4156] font-semibold mb-2 text-lg">Drag and drop a .zip file here, or click to browse</div>
                  <div className="text-sm text-[#567C8D]">Max size: 2GB. Supported: React, Next.js, Node.js, Express, Python</div>
                </label>
                {file && <div className="mt-6 text-[#2F4156] font-medium px-4 py-2 bg-[#C8D9E6]/50 rounded-xl inline-block border border-[#C8D9E6]">Selected: {file.name}</div>}
              </div>
            ) : (
              <div className="py-8 bg-[#F5EFEB] p-8 rounded-2xl border border-[#C8D9E6]">
                <label className="block text-sm font-semibold text-[#2F4156] mb-2">Git Repository URL</label>
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/org/repo.git" className="w-full px-5 py-3 rounded-xl border border-[#C8D9E6] focus:ring-2 focus:ring-[#567C8D] focus:border-[#567C8D] outline-none transition bg-[#FFFFFF] text-[#2F4156]" disabled={loading} />
                <p className="text-xs text-[#567C8D] mt-2">Public repositories supported for analysis.</p>
              </div>
            )}

            <div className="mt-10 flex justify-end">
              <button type="submit" disabled={loading} className="btn-primary px-8 py-3.5 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Uploading...' : 'Start Analysis'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UploadRepository() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#567C8D]">Loading...</div>}>
      <UploadContent />
    </Suspense>
  );
}
