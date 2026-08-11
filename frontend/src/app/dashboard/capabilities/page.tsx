'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, FileCode, Server, Database, Component, Box, Activity } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { BackButton } from '@/components/BackButton';

export default function CapabilityExplorer() {
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Find latest job
        const jobsRes = await fetch(`${API_BASE_URL}/repositories/jobs`, { headers }).catch(() => null);
        if (!jobsRes || !jobsRes.ok) throw new Error('Backend server is offline or unreachable');
        const jobsData = await jobsRes.json();
        
        let activeJobId = typeof window !== 'undefined' ? localStorage.getItem('activeJobId') : null;

        const latestJob = activeJobId 
          ? jobsData.jobs.find((j: any) => j.job_id === activeJobId)
          : [...jobsData.jobs].reverse().find((j: any) => j.status === 'Completed' || j.status === 'Reasoning');
        
        if (!latestJob) {
          setLoading(false);
          return;
        }

        const jobId = latestJob.job_id;
        setCurrentJobId(jobId);
        
        // Fetch capabilities, journeys, and gaps in parallel
        const [capRes, jourRes, gapRes] = await Promise.all([
          fetch(`${API_BASE_URL}/capabilities/${jobId}`, { headers }).catch(() => null),
          fetch(`${API_BASE_URL}/journeys/${jobId}`, { headers }).catch(() => null),
          fetch(`${API_BASE_URL}/logic-gaps/${jobId}`, { headers }).catch(() => null)
        ]);

        if (capRes && capRes.ok) {
          const capData = await capRes.json();
          setCapabilities(capData.capabilities || []);
        }
        if (jourRes && jourRes.ok) {
          const jourData = await jourRes.json();
          setJourneys(jourData.journeys || []);
        }
        if (gapRes && gapRes.ok) {
          const gapData = await gapRes.json();
          setGaps(gapData.logic_gaps || []);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'ROUTE': return <Server size={14} className="text-purple-600" />;
      case 'DB_TABLE': return <Database size={14} className="text-emerald-600" />;
      case 'SERVICE': return <Activity size={14} className="text-amber-600" />;
      case 'CONTROLLER': return <Component size={14} className="text-blue-600" />;
      default: return <FileCode size={14} className="text-slate-600" />;
    }
  };

  const extractSemanticData = (cap: any) => {
    const evidence = cap.evidence || [];
    const files = new Set<string>();
    const areas = new Set<string>();
    const actions = new Set<string>();

    evidence.forEach((e: any) => {
      files.add(e.reference);
      const rootFolder = e.reference.split(/[\/\\]/)[0];
      if (rootFolder && rootFolder !== '.' && rootFolder !== '') {
        areas.add(rootFolder);
      }
      
      const desc = e.snippet_or_description || '';
      if (desc.toLowerCase().includes('validates')) actions.add('Validates incoming data');
      else if (desc.toLowerCase().includes('transforms')) actions.add('Transforms data structures');
      else if (desc.toLowerCase().includes('applies')) actions.add('Applies business rules');
      else if (desc.toLowerCase().includes('persists')) actions.add('Persists entity state');
      else if (desc.toLowerCase().includes('client request')) actions.add('Handles external API requests');
      else actions.add(desc.length > 40 ? desc.substring(0, 40) + '...' : desc);
    });

    // Map Phase 3 implementationStatus
    const implStatus = cap.implementationStatus || cap.status || 'INSUFFICIENT_EVIDENCE';
    let status = 'Well supported';
    let statusColor = 'text-emerald-600';
    if (implStatus === 'CONFIRMED' || implStatus === 'Confirmed') {
      status = 'Confirmed';
      statusColor = 'text-emerald-600';
    } else if (implStatus === 'PARTIALLY_IMPLEMENTED' || implStatus === 'Partially Implemented') {
      status = 'Partially Implemented';
      statusColor = 'text-amber-600';
    } else if (implStatus === 'INFERRED') {
      status = 'Inferred';
      statusColor = 'text-blue-600';
    } else {
      status = 'Insufficient Evidence';
      statusColor = 'text-rose-600';
    }

    // Map Phase 3 confidence
    const confRaw = cap.confidence || 'LOW';
    let confLabel = 'Low confidence';
    let confColor = 'text-rose-700 bg-rose-50 border-rose-200';
    if (confRaw === 'HIGH') {
      confLabel = 'High confidence';
      confColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    } else if (confRaw === 'MEDIUM') {
      confLabel = 'Medium confidence';
      confColor = 'text-amber-700 bg-amber-50 border-amber-200';
    } else if (typeof cap.confidence_score === 'number') {
      // Fallback for old schema
      if (cap.confidence_score >= 0.8) {
        confLabel = 'High confidence';
        confColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      } else if (cap.confidence_score >= 0.5) {
        confLabel = 'Medium confidence';
        confColor = 'text-amber-700 bg-amber-50 border-amber-200';
      }
    }

    const capName = cap.name || (cap.category ? cap.category.replace('Capability: ', '') : 'Unknown Capability');
    const actionList = Array.from(actions).slice(0, 4); // Take max 4 for summary
    
    // Better explanation
    let explanation = cap.description || cap.reasoning_summary || `${capName} functionality was inferred from ${evidence.length} components.`;
    
    // Arrays for display
    const entryPoints = cap.entryPoints || [];
    const dependencies = cap.dependencies || [];
    const relatedEntities = cap.relatedEntities || [];

    // Overlaps for journeys and gaps based on evidence intersection
    const relatedJourneys = journeys.filter(j => 
      j.evidence && j.evidence.some((je: any) => files.has(je.reference))
    ).slice(0, 3);
    
    const relatedGaps = gaps.filter(g => 
      g.evidence && g.evidence.some((ge: any) => files.has(ge.reference))
    ).slice(0, 3);

    return {
      capName,
      confLabel,
      confColor,
      status,
      statusColor,
      areas: Array.from(areas),
      responsibilities: actionList,
      explanation,
      entryPoints,
      dependencies,
      relatedEntities,
      relatedJourneys,
      relatedGaps
    };
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in w-full">
        <div className="h-10 bg-white border border-[#C8D9E6] rounded-md w-1/3 animate-pulse"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 bg-white border border-[#C8D9E6] rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[500px]">
        <div className="bg-rose-50 text-rose-700 p-6 rounded-xl border border-rose-200 text-center max-w-md">
          <h2 className="font-bold text-lg mb-2">Error Loading Capabilities</h2>
          <p className="text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-white border border-rose-300 text-rose-700 font-bold px-4 py-2 rounded-lg text-sm hover:bg-rose-100">Retry</button>
        </div>
      </div>
    );
  }

  if (capabilities.length === 0) {
    return (
      <div className="p-12 h-full flex flex-col items-center justify-center w-full">
        <div className="text-center max-w-md bg-white border border-[#C8D9E6] rounded-3xl p-12 shadow-sm animate-fade-in">
          <div className="w-16 h-16 bg-[#F5EFEB] text-[#567C8D] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#C8D9E6]">
            <Box size={28} />
          </div>
          <h1 className="text-2xl font-bold text-[#2F4156] mb-3">No Capabilities Found</h1>
          <p className="text-[#567C8D] mb-8 leading-relaxed">Run an analysis on a repository to detect business capabilities.</p>
          <Link href="/dashboard/upload" className="btn-primary px-6 py-3 w-full">
            Upload Repository
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 py-8 max-w-[1400px] mx-auto animate-fade-in space-y-6 min-h-full">
      <div className="mb-8">
        <BackButton label="Back to Project Overview" href={currentJobId ? `/dashboard/project/${currentJobId}` : "/dashboard"} className="mb-6" />
        <h1 className="text-3xl font-bold text-[#2F4156] font-serif mb-2">Capability Explorer</h1>
        <p className="text-[#567C8D] font-medium">Detected business logic domains mapped back to supporting source code.</p>
      </div>

      <div className="space-y-6">
        {capabilities
          .filter(cap => cap.implementationStatus !== 'INSUFFICIENT_EVIDENCE' && cap.status !== 'Insufficient-Evidence')
          .map((cap, index) => {
          const uniqueId = `cap-${index}`;
          const hasEvidence = cap.evidence && cap.evidence.length > 0;
          const isExpanded = expandedId === uniqueId;
          const meta = extractSemanticData(cap);
          
          return (
            <div key={uniqueId} className="bg-white border border-[#C8D9E6] rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
              <div 
                className={`p-6 md:p-8 flex flex-col md:flex-row gap-6 transition-colors ${hasEvidence ? 'cursor-pointer hover:bg-slate-50' : 'opacity-80'}`}
                onClick={() => hasEvidence && toggleExpand(uniqueId)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-bold text-[#2F4156] flex items-center gap-2">
                      <Box className="text-[#567C8D]" size={20} />
                      {meta.capName}
                    </h2>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${meta.confColor}`}>
                      {meta.confLabel}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    {/* Responsibilities */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-3">Responsibilities</h4>
                      <ul className="space-y-2">
                        {meta.responsibilities.length > 0 ? (
                          meta.responsibilities.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[#2F4156] font-medium">
                              <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                              <span>{r}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-slate-400 italic">No specific logic derived</li>
                        )}
                        {meta.relatedGaps.map((gap, i) => (
                           <li key={`gap-${i}`} className="flex items-start gap-2 text-sm text-[#2F4156] font-medium">
                             <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                             <span className="text-amber-700">⚠ {(gap.title || gap.category || 'Gap').replace('Logic Gap: ', '')}</span>
                           </li>
                        ))}
                      </ul>
                    </div>

                    {/* Metadata summary */}
                    <div className="grid grid-cols-2 gap-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-1">Status</h4>
                        <p className={`text-sm font-bold ${meta.statusColor}`}>{meta.status}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-1">Evidence</h4>
                        <p className="text-sm font-bold text-[#2F4156]">{cap.evidence?.length || 0} Traces</p>
                      </div>
                      
                      <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 mt-1">
                        {meta.entryPoints.length > 0 && (
                           <div>
                             <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-1">APIs / Entry Points</h4>
                             <p className="text-xs font-bold text-[#2F4156] truncate max-w-full" title={meta.entryPoints.join(', ')}>
                               {meta.entryPoints[0]} {meta.entryPoints.length > 1 ? `+${meta.entryPoints.length - 1} more` : ''}
                             </p>
                           </div>
                        )}
                        
                        {meta.dependencies.length > 0 && (
                           <div>
                             <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-1">Dependencies</h4>
                             <p className="text-xs font-bold text-[#2F4156] truncate max-w-full" title={meta.dependencies.join(', ')}>
                               {meta.dependencies.join(', ')}
                             </p>
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {hasEvidence && (
                  <div className="shrink-0 flex items-center justify-end md:justify-center">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#567C8D] bg-white border border-[#C8D9E6] px-4 py-2 rounded-lg hover:bg-[#F5EFEB] transition-colors">
                      {isExpanded ? (
                        <>Close Details <ChevronUp size={16} /></>
                      ) : (
                        <>Explore Findings <ChevronDown size={16} /></>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {isExpanded && hasEvidence && (
                <div className="border-t border-[#C8D9E6] bg-[#FDFCFB] p-6 md:p-8 animate-fade-in">
                  
                  {/* Improved Reasoning Section */}
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-[#2F4156] flex items-center gap-2 mb-3">
                      <span className="text-[#567C8D]">💡</span> Reasoning & Evidence
                    </h3>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
                      <p className="text-sm text-[#2F4156] font-medium leading-relaxed">
                        {meta.explanation}
                      </p>
                    </div>
                  </div>
                  
                  {/* Evidence List */}
                  <div className="space-y-4 mb-8">
                    {cap.evidence.map((ev: any, idx: number) => {
                      const fileName = ev.reference.split(/[\/\\]/).pop();
                      const folderPath = ev.reference.replace(fileName, '');
                      
                      return (
                        <div key={idx} className="flex items-start gap-4 bg-white p-4 rounded-xl border border-[#C8D9E6] hover:border-[#567C8D] transition-colors shadow-sm">
                          <div className="w-10 h-10 shrink-0 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
                            {getSourceIcon(ev.source_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#567C8D] bg-slate-100 px-2 py-0.5 rounded">
                                {ev.source_type}
                              </span>
                              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                                {folderPath}
                              </span>
                              <span className="text-sm font-bold text-[#2F4156] font-mono break-all">
                                {fileName}
                              </span>
                            </div>
                            <div className="mt-2 text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-100">
                              <span className="font-bold text-slate-400 uppercase text-[9px] block mb-1">Why it matters</span>
                              {ev.snippet_or_description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Related Findings Links */}
                  {(meta.relatedGaps.length > 0 || meta.relatedJourneys.length > 0) && (
                    <div className="pt-6 border-t border-[#C8D9E6] grid grid-cols-1 md:grid-cols-2 gap-6">
                      {meta.relatedGaps.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-3">Related Logic Gaps</h4>
                          <div className="space-y-2">
                            {meta.relatedGaps.map(gap => (
                              <Link key={gap.id || gap.finding_id} href={`/dashboard/gaps`} className="block bg-amber-50 border border-amber-200 rounded-lg p-3 hover:bg-amber-100 transition-colors">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-bold text-amber-900">{(gap.title || gap.category || 'Gap').replace('Logic Gap: ', '')}</p>
                                    <p className="text-xs font-medium text-amber-700 mt-0.5">
                                      {gap.confidence_score >= 0.9 ? 'High confidence' : gap.confidence_score >= 0.7 ? 'Medium-high confidence' : gap.confidence_score >= 0.5 ? 'Medium confidence' : 'Low confidence'} · {(gap.confidence_score * 100).toFixed(0)}%
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {meta.relatedJourneys.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-3">Related Journeys</h4>
                          <div className="space-y-2">
                            {meta.relatedJourneys.map(journey => (
                              <Link key={journey.id || journey.finding_id} href={`/dashboard/journeys`} className="block bg-indigo-50 border border-indigo-200 rounded-lg p-3 hover:bg-indigo-100 transition-colors">
                                <div className="flex items-center gap-2">
                                  <ArrowRight size={16} className="text-indigo-600 shrink-0" />
                                  <p className="text-sm font-bold text-indigo-900">{(journey.label || journey.name || journey.category || 'Journey').replace('Journey: ', '')}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
        {capabilities.filter(cap => cap.implementationStatus !== 'INSUFFICIENT_EVIDENCE' && cap.status !== 'Insufficient-Evidence').length === 0 && (
          <div className="text-center py-12 bg-white text-[#567C8D] border border-dashed border-[#C8D9E6] rounded-2xl font-medium">
            CodeAtlas could not find any recognizable business capabilities.
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-8">
        <Link href="/dashboard/graph" className="btn-secondary px-6 py-3 flex items-center gap-2 shadow-sm bg-white border border-[#C8D9E6] text-[#567C8D] hover:bg-slate-50 font-bold rounded-lg transition-colors">
          <ArrowLeft size={20} />
          Back: Architecture Map
        </Link>
        <Link href="/dashboard/journeys" className="btn-primary px-8 py-3 flex items-center gap-2 shadow-md">
          Next: Journey Explorer
          <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}
