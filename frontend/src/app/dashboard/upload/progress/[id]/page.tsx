'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import { CodeAtlasLoader } from '@/components/CodeAtlasLoader';

export default function UploadProgress() {
  const { id } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState('Uploaded');
  const [projectName, setProjectName] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/repositories/jobs/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status || 'Processing');
          if (data.project_name) setProjectName(data.project_name);
          if (data.repository_url) setSourceLabel(data.repository_url);
          if (data.status === 'Completed') {
            localStorage.setItem('activeJobId', id as string);
            setTimeout(() => router.push('/dashboard/capabilities'), 1500);
          }
          if (data.status === 'Failed') {
            setError(`Analysis failed: ${data.error || 'Unknown error'}`);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [id, router]);

  const stages = ['Uploaded', 'Processing', 'Parsing', 'Parsed', 'Reasoning', 'Completed'];

  return (
    <div className="p-10 max-w-5xl mx-auto min-h-[calc(100vh-140px)] flex flex-col items-center justify-center animate-fade-in">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-serif font-bold text-[#2F4156] mb-3">Analyzing Repository</h1>
        <p className="text-[#567C8D] text-lg font-light">Reconstructing architecture and business capabilities…</p>
      </div>
      
      <CodeAtlasLoader text={status} className="my-8" />

      {status !== 'Completed' && status !== 'Failed' && !error && (
        <p className="mt-8 text-[#567C8D] font-medium text-sm animate-pulse text-center">
          This may take a few minutes. You can leave this page and come back later.
        </p>
      )}

      {status === 'Completed' && (
        <p className="mt-8 text-[#059669] font-semibold text-sm text-center">
          Redirecting to results…
        </p>
      )}
    </div>
  );
}
