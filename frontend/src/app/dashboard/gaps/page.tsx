'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, AlertTriangle, AlertOctagon, Info, ArrowRight, ArrowLeft, CheckCircle2, Box, FileCode, Server, Database, Component, Activity } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { BackButton } from '@/components/BackButton';

export default function LogicGapExplorer() {
  const [gaps, setGaps] = useState<any[]>([]);
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
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
        
        // Fetch gaps, capabilities, and journeys for cross-linking
        const [gapRes, capRes, jourRes] = await Promise.all([
          fetch(`${API_BASE_URL}/logic-gaps/${jobId}`, { headers }).catch(() => null),
          fetch(`${API_BASE_URL}/capabilities/${jobId}`, { headers }).catch(() => null),
          fetch(`${API_BASE_URL}/journeys/${jobId}`, { headers }).catch(() => null)
        ]);

        if (gapRes && gapRes.ok) {
          const gapData = await gapRes.json();
          const validGaps = (gapData.logic_gaps || []).filter((g: any) => g.status !== 'Insufficient-Evidence');
          setGaps(validGaps);
        }
        if (capRes && capRes.ok) {
          const capData = await capRes.json();
          setCapabilities(capData.capabilities || []);
        }
        if (jourRes && jourRes.ok) {
          const jourData = await jourRes.json();
          setJourneys(jourData.journeys || []);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'ROUTE': return <Server size={14} className="text-purple-600" />;
      case 'DB_TABLE': return <Database size={14} className="text-emerald-600" />;
      case 'SERVICE': return <Activity size={14} className="text-amber-600" />;
      case 'CONTROLLER': return <Component size={14} className="text-blue-600" />;
      default: return <FileCode size={14} className="text-slate-600" />;
    }
  };

  const enrichGapData = (gap: any) => {
    // 1. Title and Text Mapping
    const isResolved = gap.status === 'Resolved';
    const title = gap.title || (gap.category ? gap.category.replace('Logic Gap: ', '') : 'Logic Gap');
    const confidencePercent = (gap.confidence_score * 100).toFixed(0);
    const impact = gap.impact || gap.rationale || 'Architectural blind spot affecting system reliability or security.';
    const recommendation = gap.recommendation || gap.remediation || 'Review the identified components and implement the missing architectural constraint.';

    // 2. Confidence Tier
    const isManualReview = title.includes('MANUAL REVIEW REQUIRED') || title.includes('POTENTIAL GAP');
    const score = gap.confidence_score !== undefined ? gap.confidence_score : (gap.confidence === 'HIGH' ? 0.9 : gap.confidence === 'MEDIUM' ? 0.6 : 0.3);
    let confLabel = isManualReview ? 'Manual Review Needed' : 'Low confidence';
    let confColor = 'text-slate-600 bg-slate-100 border-slate-200';
    if (!isManualReview) {
      if (score >= 0.9 || gap.confidence === 'HIGH') { confLabel = 'High confidence'; confColor = 'text-emerald-700 bg-emerald-50 border-emerald-200'; }
      else if (score >= 0.7 || gap.confidence === 'MEDIUM') { confLabel = 'Medium confidence'; confColor = 'text-blue-700 bg-blue-50 border-blue-200'; }
    } else {
      confColor = 'text-amber-700 bg-amber-50 border-amber-200 border-dashed';
    }

    // 3. Severity
    let severity = gap.severity ? gap.severity.charAt(0).toUpperCase() + gap.severity.slice(1).toLowerCase() : 'Low';
    let severityIcon = <Info size={16} />;
    let severityColor = 'text-blue-600';
    let borderColor = 'border-blue-200';
    let bgColor = 'bg-blue-50';
    
    if (severity === 'Critical') {
      severityIcon = <AlertOctagon size={16} />;
      severityColor = 'text-rose-600';
      borderColor = 'border-rose-300';
      bgColor = 'bg-rose-50/30';
    } else if (severity === 'High') {
      severityIcon = <ShieldAlert size={16} />;
      severityColor = 'text-orange-600';
      borderColor = 'border-orange-300';
      bgColor = 'bg-orange-50/30';
    } else if (severity === 'Medium') {
      severityIcon = <AlertTriangle size={16} />;
      severityColor = 'text-amber-600';
      borderColor = 'border-amber-300';
      bgColor = 'bg-amber-50/30';
    }

    // 4. Checked Locations (New)
    const checkedLocations = gap.checkedAreas || gap.checkedLocations || [];

    // 5. Affected Components (Architecture Areas)
    const files = new Set<string>();
    let components = new Set<string>();
    
    const evidenceTraces = gap.evidenceTraces || gap.evidence || [];
    evidenceTraces.forEach((e: any) => {
      files.add(e.reference);
      const rootFolder = e.reference.split(/[\/\\]/)[0];
      if (rootFolder && rootFolder !== '.' && e.source_type !== 'ABSENCE_CHECK') components.add(rootFolder);
    });
    
    // Merge backend provided components
    if (gap.affectedComponents && Array.isArray(gap.affectedComponents)) {
      gap.affectedComponents.forEach((c: string) => components.add(c));
    }

    // 6. Cross-Linking
    const relatedCapabilities = capabilities.filter(c => 
      c.evidence && c.evidence.some((ce: any) => files.has(ce.reference))
    ).slice(0, 2);
    
    const relatedJourneys = journeys.filter(j => 
      j.evidence && j.evidence.some((je: any) => files.has(je.reference))
    ).slice(0, 2);

    return {
      title,
      confLabel,
      confColor,
      severity,
      severityIcon,
      severityColor,
      borderColor,
      bgColor,
      impact,
      recommendation,
      components: Array.from(components),
      checkedLocations,
      reasoning: gap.reasoning || gap.reasoning_summary || 'No reasoning provided.',
      evidenceTraces,
      relatedCapabilities,
      relatedJourneys,
      files
    };
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in w-full">
        <div className="h-10 bg-white border border-[#C8D9E6] rounded-md w-1/3 animate-pulse"></div>
        {[1, 2].map(i => (
          <div key={i} className="h-64 bg-white border border-[#C8D9E6] rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[500px]">
        <div className="bg-rose-50 text-rose-700 p-6 rounded-xl border border-rose-200 text-center max-w-md">
          <h2 className="font-bold text-lg mb-2">Error Loading Logic Gaps</h2>
          <p className="text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-white border border-rose-300 text-rose-700 font-bold px-4 py-2 rounded-lg text-sm hover:bg-rose-100">Retry</button>
        </div>
      </div>
    );
  }

  if (gaps.length === 0) {
    return (
      <div className="p-12 h-full flex flex-col items-center justify-center w-full">
        <div className="text-center max-w-md bg-white border border-[#C8D9E6] rounded-3xl p-12 shadow-sm animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-200">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="text-2xl font-bold text-[#2F4156] mb-3">No Logic Gaps Found</h1>
          <p className="text-[#567C8D] mb-8 leading-relaxed">Your application structure looks solid based on current domain constraints and detected capabilities.</p>
          <Link href="/dashboard" className="btn-primary px-6 py-3 w-full">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 py-8 max-w-[1400px] mx-auto animate-fade-in space-y-6 min-h-full">
      <div className="mb-8">
        <BackButton label="Back to Project Overview" href={currentJobId ? `/dashboard/project/${currentJobId}` : "/dashboard"} className="mb-6" />
        <h1 className="text-3xl font-bold text-[#2F4156] font-serif mb-2 flex items-center gap-3">
          <ShieldAlert className="text-[#567C8D]" size={32} />
          Logic Gap Intelligence
        </h1>
        <p className="text-[#567C8D] font-medium">Evidence-based architectural blind spots requiring engineering review.</p>
      </div>

      <div className="space-y-8">
        {gaps.length === 0 ? (
          <div className="bg-white border border-[#C8D9E6] p-12 rounded-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#F5EFEB] rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="text-[#567C8D]" size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#2F4156] mb-2">No Logic Gaps Detected</h3>
            <p className="text-[#567C8D] max-w-md">
              CodeAtlas did not find sufficient evidence of missing architectural flows or logic gaps in this repository.
            </p>
          </div>
        ) : (
          gaps.map((gap, index) => {
            const uniqueId = gap.id || gap.finding_id || `gap-${index}`;
            const meta = enrichGapData(gap);
          
          return (
            <div key={uniqueId} className={`bg-white rounded-2xl border ${meta.borderColor} shadow-sm overflow-hidden transition-all duration-300 relative`}>
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${meta.bgColor.replace('/30', '')}`}></div>
              
              <div className="p-6 md:p-8 ml-1.5">
                
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${meta.severityColor} bg-white border ${meta.borderColor}`}>
                        {meta.severityIcon} {meta.severity} Severity
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${meta.confColor}`}>
                        {meta.confLabel}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#2F4156]">
                      {meta.title}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Column: Context & Recommendation */}
                  <div className="lg:col-span-1 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-2">Impact</h4>
                      <p className="text-sm font-medium text-[#2F4156] bg-rose-50/50 border border-rose-100 p-3 rounded-lg">
                        {meta.impact}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-2">Recommended Action</h4>
                      <p className="text-sm font-medium text-[#2F4156] bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                        <span>{meta.recommendation}</span>
                      </p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-2">Affected Components</h4>
                      <div className="flex flex-wrap gap-2">
                        {meta.components.length > 0 ? (
                          meta.components.map((c, i) => (
                            <span key={i} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-md">
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm italic text-slate-500">Repository-wide absence detected.</span>
                        )}
                      </div>
                    </div>
                    
                    {meta.checkedLocations.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-2">What Was Checked</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {meta.checkedLocations.map((loc: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-medium rounded">
                              {loc}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-[#567C8D] mt-2">Before confirming this gap, the system scanned all known implementations of these locations and verified their absence.</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Reasoning & Evidence */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-2 flex items-center gap-2">
                        <Info size={14} /> Reasoning
                      </h4>
                      <p className="text-sm text-[#2F4156] font-medium leading-relaxed">
                        {meta.reasoning}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] mb-3">Evidence Traces</h4>
                      <div className="space-y-3">
                        {meta.evidenceTraces.map((ev: any, idx: number) => {
                          const fileName = ev.file_path ? ev.file_path.split(/[\/\\]/).pop() : (ev.reference || '').split(/[\/\\]/).pop();
                          const folderPath = ev.file_path ? ev.file_path.replace(fileName, '') : (ev.reference || '').replace(fileName, '');
                          
                          return (
                            <div key={idx} className="flex flex-col gap-2 bg-white p-4 rounded-lg border border-[#C8D9E6] hover:border-[#567C8D] transition-colors shadow-sm group">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-[#567C8D] bg-slate-100 px-1.5 py-0.5 rounded">
                                  {ev.source_type}
                                </span>
                                {ev.title && (
                                  <span className="text-xs font-bold text-[#2F4156]">{ev.title}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap bg-slate-50 border border-slate-100 p-1.5 rounded text-xs font-mono">
                                <span className="text-slate-500 hidden sm:inline truncate max-w-[200px]">
                                  {folderPath}
                                </span>
                                <span className="font-bold text-[#2F4156] break-all group-hover:text-blue-600 transition-colors">
                                  {fileName}
                                </span>
                                {ev.line_start && (
                                  <span className="text-slate-400">
                                    :{ev.line_start}{ev.line_end && ev.line_end !== ev.line_start ? `-${ev.line_end}` : ''}
                                  </span>
                                )}
                                {ev.symbol && (
                                  <span className="text-purple-600 ml-1 flex items-center before:content-[''] before:w-1 before:h-1 before:bg-slate-300 before:rounded-full before:mr-2">
                                    {ev.symbol}
                                  </span>
                                )}
                              </div>
                              <div className="text-[12px] font-medium text-slate-700">
                                {ev.description || ev.snippet_or_description}
                              </div>
                              
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="bg-amber-50/50 p-2 rounded border border-amber-100">
                                  <span className="font-bold text-amber-700 uppercase text-[9px] block mb-1">Why it matters</span>
                                  <span className="text-[11px] text-amber-900">{ev.why_it_matters || ev.snippet_or_description}</span>
                                </div>
                                {ev.strength && (
                                  <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100">
                                    <span className="font-bold text-emerald-700 uppercase text-[9px] block mb-1">Evidence Strength</span>
                                    <span className="text-[11px] text-emerald-900">{ev.strength}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Cross-linking Row */}
                {(meta.relatedCapabilities.length > 0 || meta.relatedJourneys.length > 0) && (
                  <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#567C8D] self-center mr-2">Related Entities:</span>
                    
                    {meta.relatedCapabilities.map((cap: any) => (
                      <Link key={cap.id || cap.finding_id} href={`/dashboard/capabilities`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                        <Box size={14} className="text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">{cap.name || cap.category.replace('Capability: ', '')}</span>
                      </Link>
                    ))}

                    {meta.relatedJourneys.map((journey: any) => (
                      <Link key={journey.id || journey.finding_id} href={`/dashboard/journeys`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors">
                        <ArrowRight size={14} className="text-indigo-600" />
                        <span className="text-sm font-semibold text-indigo-800">{journey.label || journey.name || journey.category.replace('Journey: ', '')}</span>
                      </Link>
                    ))}
                    
                    <Link href={`/dashboard`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                      <Server size={14} className="text-slate-600" />
                      <span className="text-xs font-bold text-slate-700">Architecture Map</span>
                    </Link>
                  </div>
                )}

              </div>
            </div>
          );
        })
        )}
      </div>

      <div className="flex justify-between items-center mt-8">
        <Link href="/dashboard/journeys" className="btn-secondary px-6 py-3 flex items-center gap-2 shadow-sm bg-white border border-[#C8D9E6] text-[#567C8D] hover:bg-slate-50 font-bold rounded-lg transition-colors">
          <ArrowLeft size={20} />
          Back: Journey Explorer
        </Link>
        <Link href="/dashboard/reports" className="btn-primary px-8 py-3 flex items-center gap-2 shadow-md">
          Next: Reports
          <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}
