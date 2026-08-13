'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import { BackButton } from '@/components/BackButton';
import { Box, ArrowRight, ShieldAlert, FileCode, CheckCircle2, AlertTriangle, Info, Activity, Network } from 'lucide-react';

export default function ProjectDashboard() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [job, setJob] = useState<any>(null);
  
  // Data aggregates
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      localStorage.setItem('activeJobId', id);
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Fetch Job Details
        const jobRes = await fetch(`${API_BASE_URL}/repositories/jobs`, { headers }).catch(() => null);
        if (jobRes && jobRes.ok) {
          const data = await jobRes.json();
          const currentJob = data.jobs?.find((j: any) => j.job_id === id);
          if (currentJob) setJob(currentJob);
        }

        // Fetch Analysis Data
        const [capRes, jourRes, gapRes] = await Promise.all([
          fetch(`${API_BASE_URL}/capabilities/${id}`, { headers }).catch(() => null),
          fetch(`${API_BASE_URL}/journeys/${id}`, { headers }).catch(() => null),
          fetch(`${API_BASE_URL}/logic-gaps/${id}`, { headers }).catch(() => null)
        ]);

        if (capRes && capRes.ok) {
          const capData = await capRes.json();
          setCapabilities((capData.capabilities || []).filter((c: any) => c.status !== 'Insufficient-Evidence'));
        }
        
        if (jourRes && jourRes.ok) {
          const jourData = await jourRes.json();
          setJourneys((jourData.journeys || []).filter((j: any) => j.status !== 'Insufficient-Evidence'));
        }
        
        if (gapRes && gapRes.ok) {
          const gapData = await gapRes.json();
          setGaps((gapData.logic_gaps || []).filter((g: any) => g.status !== 'Insufficient-Evidence'));
        }
        
      } catch {
        // Silently handle offline/network errors
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleAction = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 w-full animate-fade-in">
        <BackButton label="Back to Dashboard" href="/dashboard" className="mb-4" />
        <div className="animate-pulse bg-white w-full h-40 rounded-[24px] border border-[#C8D9E6] shadow-sm mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="animate-pulse bg-white w-full h-32 rounded-xl border border-[#C8D9E6] shadow-sm" />
            <div className="animate-pulse bg-white w-full h-32 rounded-xl border border-[#C8D9E6] shadow-sm" />
            <div className="animate-pulse bg-white w-full h-32 rounded-xl border border-[#C8D9E6] shadow-sm" />
            <div className="animate-pulse bg-white w-full h-32 rounded-xl border border-[#C8D9E6] shadow-sm" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full text-center">
        <BackButton label="Back to Dashboard" href="/dashboard" className="mb-8 justify-center" />
        <h1 className="text-2xl font-bold text-[#2F4156] mb-4">Project Not Found</h1>
        <p className="text-[#567C8D]">The project you are looking for does not exist or has been deleted.</p>
      </div>
    );
  }

  const projectName = job.project_name || job.repo_id || 'Unnamed Project';

  // --- COMPUTE AGGREGATE METRICS ---
  
  const allFindings = [...capabilities, ...journeys, ...gaps];
  const allEvidence = allFindings.flatMap(f => f.evidence || []);
  
  const uniqueFiles = new Set(allEvidence.map(e => e.reference));
  const uniqueModules = new Set(allEvidence.map(e => e.reference.split(/[\/\\]/)[0]).filter(m => m && m !== '.'));
  
  let highRiskCount = 0;
  const gapSeverities = { critical: 0, high: 0, medium: 0, low: 0 };
  
  gaps.forEach(g => {
    const title = (g.category || '').toLowerCase();
    const score = g.confidence_score !== undefined ? g.confidence_score : 
      (g.confidence === 'HIGH' || g.confidence === 'High' ? 0.9 : 
       g.confidence === 'MEDIUM' || g.confidence === 'Medium' ? 0.6 : 0.3);
    if (score >= 0.85 || title.includes('auth') || title.includes('password')) gapSeverities.critical++;
    else if (score >= 0.7 || title.includes('rate limit')) gapSeverities.high++;
    else if (score >= 0.5) gapSeverities.medium++;
    else gapSeverities.low++;
  });
  
  highRiskCount = gapSeverities.critical + gapSeverities.high;
  
  const avgConfidence = allFindings.length > 0 
    ? (allFindings.reduce((acc, curr) => {
        const score = curr.confidence_score !== undefined ? curr.confidence_score : 
          (curr.confidence === 'HIGH' || curr.confidence === 'High' ? 0.9 : 
           curr.confidence === 'MEDIUM' || curr.confidence === 'Medium' ? 0.6 : 0.3);
        return acc + score;
      }, 0) / allFindings.length)
    : 0;
    
  const capCompleteness = capabilities.length > 0 
    ? (capabilities.reduce((acc, curr) => {
        const score = curr.confidence_score !== undefined ? curr.confidence_score : 
          (curr.confidence === 'HIGH' || curr.confidence === 'High' ? 0.9 : 
           curr.confidence === 'MEDIUM' || curr.confidence === 'Medium' ? 0.6 : 0.3);
        return acc + score;
      }, 0) / capabilities.length) * 100
    : 0;
    
  const secScore = Math.max(0, 100 - (gapSeverities.critical * 20 + gapSeverities.high * 10));
  const maintainability = Math.max(0, 100 - (gaps.length * 5));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 w-full animate-fade-in">
      <BackButton label="Back to Dashboard" href="/dashboard" className="mb-2" />
      
      {/* Project Header */}
      <div className="bg-white border border-[#C8D9E6] rounded-[24px] p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5EFEB]/50 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2F4156] font-serif mb-3">{projectName}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#567C8D] font-medium">
              <span className="flex items-center gap-1.5 bg-[#F5EFEB] px-3 py-1.5 rounded-full border border-[#C8D9E6]">
                <span className={`w-2 h-2 rounded-full ${job.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                {job.status}
              </span>
              <span className="font-mono bg-[#F5EFEB] px-3 py-1.5 rounded-full border border-[#C8D9E6]">ID: {job.job_id.slice(0, 12)}</span>
              <span className="text-slate-400">|</span>
              <span className="text-[#567C8D]">Overall Confidence: <strong className="text-[#2F4156]">{(avgConfidence * 100).toFixed(0)}%</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => handleAction('/dashboard/graph')} className="flex items-center gap-2 bg-[#2F4156] text-white px-5 py-2.5 rounded-xl font-bold shadow hover:bg-[#1f2d3d] transition-colors">
              <Network size={18} />
              Architecture Map
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Analysis Snapshot & Architecture Health */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Analysis Snapshot */}
          <div className="bg-white border border-[#C8D9E6] rounded-[20px] p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#567C8D] mb-5 flex items-center gap-2">
              <Activity size={16} /> Analysis Snapshot
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-2xl font-bold text-[#2F4156] mb-1">{uniqueFiles.size}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-[#567C8D]">Files Analyzed</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-2xl font-bold text-[#2F4156] mb-1">{uniqueModules.size}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-[#567C8D]">Modules Detected</p>
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-[#567C8D]">Capabilities</span>
                <span className="text-[#2F4156] bg-slate-100 px-2.5 py-0.5 rounded font-bold">{capabilities.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-[#567C8D]">Journeys</span>
                <span className="text-[#2F4156] bg-slate-100 px-2.5 py-0.5 rounded font-bold">{journeys.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-[#567C8D]">Logic Gaps</span>
                <span className="text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded font-bold">{gaps.length}</span>
              </div>
            </div>
          </div>

          {/* Architecture Health */}
          <div className="bg-white border border-[#C8D9E6] rounded-[20px] p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#567C8D] mb-5">Architecture Health</h2>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold text-[#567C8D] mb-1.5">
                  <span>Security</span>
                  <span>{secScore.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${secScore > 80 ? 'bg-emerald-500' : secScore > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${secScore}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-bold text-[#567C8D] mb-1.5">
                  <span>Completeness</span>
                  <span>{capCompleteness.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${capCompleteness}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#567C8D] mb-1.5">
                  <span>Maintainability</span>
                  <span>{maintainability.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${maintainability > 80 ? 'bg-emerald-500' : maintainability > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${maintainability}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: Discoveries & Risks */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Capability Summary */}
            <div className="bg-white border border-[#C8D9E6] rounded-[20px] p-6 shadow-sm flex flex-col">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#567C8D] mb-4 flex items-center gap-2">
                <Box size={16} /> Top Capabilities
              </h2>
              <div className="flex-1 space-y-2 mb-6">
                {capabilities.slice(0, 5).map((cap: any) => (
                  <div key={cap.id || cap.finding_id} className="flex items-center gap-2 text-sm font-medium text-[#2F4156] bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                    <Box size={14} className="text-[#567C8D]" />
                    <span className="truncate">{(cap.name || cap.category || 'Unknown').replace('Capability: ', '')}</span>
                  </div>
                ))}
                {capabilities.length === 0 && <p className="text-sm text-slate-400 italic">No capabilities detected</p>}
              </div>
              <button onClick={() => handleAction('/dashboard/capabilities')} className="w-full bg-slate-50 hover:bg-blue-50 text-[#567C8D] hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-colors py-2.5 rounded-xl font-bold text-sm">
                Explore All Capabilities
              </button>
            </div>

            {/* Journey Summary */}
            <div className="bg-white border border-[#C8D9E6] rounded-[20px] p-6 shadow-sm flex flex-col">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#567C8D] mb-4 flex items-center gap-2">
                <ArrowRight size={16} /> Reconstructed Journeys
              </h2>
              <div className="flex-1 space-y-2 mb-6">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold text-[#2F4156]">{journeys.length}</span>
                  <span className="text-sm font-medium text-[#567C8D]">detected</span>
                </div>
                {journeys.slice(0, 3).map((journey: any) => (
                  <div key={journey.id || journey.finding_id} className="text-sm font-medium text-[#2F4156] truncate border-l-2 border-indigo-300 pl-3 py-1">
                    {journey.label || journey.name || (journey.category ? journey.category.replace('Journey: ', '') : 'Unknown')}
                  </div>
                ))}
              </div>
              <button onClick={() => handleAction('/dashboard/journeys')} className="w-full bg-slate-50 hover:bg-indigo-50 text-[#567C8D] hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-colors py-2.5 rounded-xl font-bold text-sm">
                View Journey Maps
              </button>
            </div>
          </div>

          {/* Logic Gap Summary */}
          <div className="bg-white border border-[#C8D9E6] rounded-[20px] p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#567C8D] mb-6 flex items-center gap-2">
              <ShieldAlert size={16} /> Logic Gap Summary
            </h2>
            
            <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
              <div className="shrink-0 text-center">
                <div className="text-5xl font-bold text-[#2F4156] mb-1">{gaps.length}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#567C8D]">Total Gaps</div>
              </div>
              
              {/* Findings Distribution */}
              <div className="flex-1 w-full space-y-4">
                {/* Critical */}
                <div className="flex items-center gap-3">
                  <div className="w-16 text-right text-xs font-bold text-rose-700 uppercase">Critical</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-3">
                    <div className="bg-rose-600 h-3 rounded-full" style={{ width: `${gaps.length ? (gapSeverities.critical / gaps.length) * 100 : 0}%` }}></div>
                  </div>
                  <div className="w-6 text-xs font-bold text-slate-500">{gapSeverities.critical}</div>
                </div>
                {/* High */}
                <div className="flex items-center gap-3">
                  <div className="w-16 text-right text-xs font-bold text-orange-600 uppercase">High</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-3">
                    <div className="bg-orange-500 h-3 rounded-full" style={{ width: `${gaps.length ? (gapSeverities.high / gaps.length) * 100 : 0}%` }}></div>
                  </div>
                  <div className="w-6 text-xs font-bold text-slate-500">{gapSeverities.high}</div>
                </div>
                {/* Medium */}
                <div className="flex items-center gap-3">
                  <div className="w-16 text-right text-xs font-bold text-amber-600 uppercase">Medium</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-3">
                    <div className="bg-amber-400 h-3 rounded-full" style={{ width: `${gaps.length ? (gapSeverities.medium / gaps.length) * 100 : 0}%` }}></div>
                  </div>
                  <div className="w-6 text-xs font-bold text-slate-500">{gapSeverities.medium}</div>
                </div>
                {/* Low */}
                <div className="flex items-center gap-3">
                  <div className="w-16 text-right text-xs font-bold text-blue-600 uppercase">Low</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-3">
                    <div className="bg-blue-400 h-3 rounded-full" style={{ width: `${gaps.length ? (gapSeverities.low / gaps.length) * 100 : 0}%` }}></div>
                  </div>
                  <div className="w-6 text-xs font-bold text-slate-500">{gapSeverities.low}</div>
                </div>
              </div>
            </div>
            
            <button onClick={() => handleAction('/dashboard/gaps')} className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              Review Logic Gaps <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
