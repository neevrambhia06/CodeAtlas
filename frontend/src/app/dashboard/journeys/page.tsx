'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ArrowRight, ArrowDown, Activity, Code, Server, Database, Component, FileCode } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function JourneyExplorer() {
  const [journeys, setJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  useEffect(() => {
    const fetchJourneys = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const jobsRes = await fetch(`${API_BASE_URL}/repositories/jobs`, { headers }).catch(() => null);
        if (!jobsRes || !jobsRes.ok) throw new Error('Backend server is offline or unreachable');
        const jobsData = await jobsRes.json();
        
        const activeJobId = typeof window !== 'undefined' ? localStorage.getItem('activeJobId') : null;

        const latestJob = activeJobId 
          ? jobsData.jobs.find((j: any) => j.job_id === activeJobId)
          : [...jobsData.jobs].reverse().find((j: any) => j.status === 'Completed' || j.status === 'Reasoning');
        
        if (!latestJob) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/journeys/${latestJob.job_id}`, { headers }).catch(() => null);
        if (!res || !res.ok) throw new Error('Failed to fetch journeys');
        const data = await res.json();
        
        setJourneys(data.journeys || []);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJourneys();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setActiveStepId(null); // Reset active step when toggling journey
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'ENTRY': return <Activity size={14} className="text-emerald-600" />;
      case 'UI': return <Component size={14} className="text-blue-600" />;
      case 'ACTION': return <Activity size={14} className="text-amber-600" />;
      case 'FUNCTION': return <Code size={14} className="text-purple-600" />;
      case 'API': return <Server size={14} className="text-pink-600" />;
      case 'DATABASE': return <Database size={14} className="text-teal-600" />;
      default: return <FileCode size={14} className="text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div className="h-10 bg-surface rounded-md w-1/3 animate-pulse"></div>
        {[1, 2].map(i => (
          <div key={i} className="h-40 bg-surface rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[500px]">
        <div className="bg-error/10 text-error p-6 rounded-xl border border-error/20 text-center max-w-md">
          <h2 className="font-bold text-lg mb-2">Error Loading Journeys</h2>
          <p className="text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 btn-primary px-4 py-2 text-sm">Retry</button>
        </div>
      </div>
    );
  }

  if (journeys.length === 0) {
    return (
      <div className="p-12 h-full flex flex-col items-center justify-center">
        <div className="text-center max-w-md card-premium p-12 animate-fade-in">
          <div className="w-16 h-16 bg-bgbase text-secondary rounded-full flex items-center justify-center mx-auto mb-6 border border-bordercolor shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
          </div>
          <h1 className="heading-display text-2xl font-bold text-primary mb-3">No Journeys Detected</h1>
          <p className="text-textmuted mb-8 leading-relaxed">Run an analysis on a repository to map end-to-end user journeys.</p>
          <Link href="/dashboard/upload" className="btn-primary px-6 py-3 w-full">
            Upload Repository
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-8 py-8 animate-fade-in space-y-6 min-h-full">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-textmuted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Overview
        </Link>
        <h1 className="heading-display text-3xl font-bold text-primary mb-2">Journey Explorer</h1>
        <p className="text-textmuted">End-to-end user flows reconstructed directly from codebase logic.</p>
      </div>

      <div className="space-y-6">
        {journeys
          .filter(journey => journey.status !== 'INSUFFICIENT_EVIDENCE' && journey.status !== 'Insufficient-Evidence')
          .map((journey, index) => {
          const uniqueId = `journey-${index}`;
          const steps = journey.steps || [];
          const hasEvidence = steps.length > 0;
          const isExpanded = expandedId === uniqueId;
          const journeyName = journey.category ? journey.category.replace('Journey: ', '') : journey.name || 'Journey';
          
          let confLabel = 'Low confidence';
          let confColor = 'text-slate-600 bg-slate-100 border-slate-200';
          const confScore = journey.confidence === 'HIGH' ? 84 : journey.confidence === 'MEDIUM' ? 62 : 31;
          
          if (journey.status === 'COMPLETE_JOURNEY') {
            confLabel = `Verified · ${confScore}%`;
            confColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
          } else if (journey.status === 'PARTIAL_JOURNEY') {
            confLabel = `Partially Verified · ${confScore}%`;
            confColor = 'text-amber-700 bg-amber-50 border-amber-200';
          }

          return (
            <div key={uniqueId} className="card-premium overflow-hidden transition-all duration-300">
              <div 
                className={`p-6 flex flex-col transition-colors ${hasEvidence ? 'cursor-pointer hover:bg-bgbase/50' : 'opacity-80'}`}
                onClick={() => hasEvidence && toggleExpand(uniqueId)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h2 className="font-heading text-lg font-bold text-primary flex items-center gap-2">
                        <span className="text-secondary text-sm">✦</span> {journeyName}
                      </h2>
                      {hasEvidence ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${confColor}`}>
                          {confLabel}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-bgbase text-textmuted border border-bordercolor">
                          Incomplete Flow
                        </span>
                      )}
                    </div>
                    {hasEvidence && (
                      <p className="text-xs text-textmuted">Evidence: {steps.length} verified transitions</p>
                    )}
                  </div>
                  
                  {hasEvidence ? (
                    <div className="text-textmuted flex items-center gap-2 text-sm font-medium self-start sm:self-auto">
                      {isExpanded ? (
                        <><span className="hidden sm:inline">Hide Map</span> <ChevronUp size={20} className="text-secondary" /></>
                      ) : (
                        <><span className="hidden sm:inline">View Journey</span> <ChevronDown size={20} className="text-secondary" /></>
                      )}
                    </div>
                  ) : (
                    <div className="text-textmuted text-sm italic pr-2 self-start sm:self-auto">
                      Missing traces
                    </div>
                  )}
                </div>

                {/* Step Flow Visualization (Summary Banner) */}
                {hasEvidence && !isExpanded && (
                  <div className="flex flex-wrap items-center gap-2 mt-2 pt-4 border-t border-bordercolor/50">
                    {steps.slice(0, 6).map((step: any, idx: number) => (
                      <div key={idx} className="flex items-center">
                        <div className="bg-surface border border-bordercolor px-3 py-1.5 rounded-md text-xs font-semibold text-textmain flex items-center shadow-sm">
                          {getStepIcon(step.stepType)}
                          <span className="ml-1.5 truncate max-w-[120px]">{step.label}</span>
                        </div>
                        {idx < Math.min(steps.length, 6) - 1 && (
                          <ArrowRight size={14} className="text-bordercolor mx-1.5 shrink-0" />
                        )}
                      </div>
                    ))}
                    {steps.length > 6 && (
                      <div className="text-xs font-medium text-textmuted ml-2">
                        + {steps.length - 6} more steps
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Detailed Evidence Expandable Node */}
              {isExpanded && (
                <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] p-6 lg:p-10 animate-fade-in flex flex-col md:flex-row gap-8">
                  
                  {/* Left: Journey Graph */}
                  <div className="flex-1 max-w-xl">
                    <h3 className="text-sm font-bold text-[#2F4156] mb-6 uppercase tracking-wider">Execution Path</h3>
                    <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#C8D9E6] before:to-transparent">
                      {steps.map((step: any, idx: number) => {
                        const isSelected = activeStepId === step.id || (!activeStepId && idx === 0);
                        return (
                          <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group py-3">
                            {/* Connector Node */}
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#F8FAFC] shadow-sm z-10 transition-colors shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${isSelected ? 'bg-[#567C8D] text-white' : 'bg-[#FFFFFF] text-[#567C8D] group-hover:bg-[#567C8D]/20'}`}>
                                {getStepIcon(step.stepType)}
                            </div>
                            
                            {/* Card */}
                            <div 
                              className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border ${isSelected ? 'border-[#567C8D] shadow-md bg-white' : 'border-[#C8D9E6] bg-white hover:border-[#567C8D]/50'} cursor-pointer transition-all`}
                              onClick={() => setActiveStepId(step.id)}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-[#567C8D] uppercase tracking-wider">{step.stepType}</span>
                                {step.confidence === 'VERIFIED' && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Verified"></span>}
                              </div>
                              <div className="font-semibold text-[#2F4156] text-sm break-words">{step.label}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Step Details Panel */}
                  <div className="w-full md:w-80 shrink-0">
                    <div className="sticky top-6 bg-white border border-[#C8D9E6] rounded-xl p-6 shadow-sm min-h-[300px]">
                      {(() => {
                        const effectiveStepId = activeStepId || (steps.length > 0 ? steps[0].id : null);
                        if (!effectiveStepId) return (
                          <div className="h-full flex flex-col items-center justify-center text-center text-[#567C8D] opacity-60">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
                              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                              <polyline points="10 17 15 12 10 7"></polyline>
                              <line x1="15" y1="12" x2="3" y2="12"></line>
                            </svg>
                            <p className="text-sm">Select a step in the execution path to view detailed evidence.</p>
                          </div>
                        );
                        
                        const step = steps.find((s: any) => s.id === effectiveStepId);
                        if (!step) return null;
                        const ev = step.evidence && step.evidence.length > 0 ? step.evidence[0] : null;
                        
                        return (
                          <div className="animate-fade-in space-y-5">
                            <div>
                              <h4 className="text-xs font-bold text-[#567C8D] uppercase mb-1">Selected Step</h4>
                              <p className="font-semibold text-[#2F4156] break-words">{step.label}</p>
                            </div>
                            
                            <div>
                              <h4 className="text-xs font-bold text-[#567C8D] uppercase mb-1">Component Type</h4>
                              <p className="text-sm text-[#2F4156]">{step.stepType}</p>
                            </div>
                            
                            {ev && (
                              <>
                                <div>
                                  <h4 className="text-xs font-bold text-[#567C8D] uppercase mb-1">Source Traced</h4>
                                  <p className="text-sm font-mono text-[#2F4156] bg-slate-50 p-2 rounded border border-slate-100 break-all">{ev.reference}</p>
                                </div>
                                {ev.symbol && (
                                  <div>
                                    <h4 className="text-xs font-bold text-[#567C8D] uppercase mb-1">Invoked Symbol</h4>
                                    <p className="text-sm font-mono text-[#2F4156]">{ev.symbol}</p>
                                  </div>
                                )}
                                <div>
                                  <h4 className="text-xs font-bold text-[#567C8D] uppercase mb-1">Trace Evidence</h4>
                                  <p className="text-sm text-[#2F4156] italic">"{ev.snippet_or_description}"</p>
                                </div>
                              </>
                            )}
                            
                            <div>
                              <h4 className="text-xs font-bold text-[#567C8D] uppercase mb-1">Trace Confidence</h4>
                              <p className="text-sm text-[#2F4156]">{step.confidence}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                </div>
              )}
            </div>
          );
        })}
        {journeys.filter(journey => journey.status !== 'INSUFFICIENT_EVIDENCE' && journey.status !== 'Insufficient-Evidence').length === 0 && (
          <div className="text-center py-12 card-premium text-textmuted border-dashed border-bordercolor">
            CodeAtlas could not trace any end-to-end user journeys based on the provided repository code.
          </div>
        )}
      </div>

      <div className="flex justify-end mt-8">
        <Link href="/dashboard/gaps" className="btn-primary px-8 py-3 flex items-center gap-2 shadow-md">
          Next: Logic Gaps
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
        </Link>
      </div>
    </div>
  );
}
