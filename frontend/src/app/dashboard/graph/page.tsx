'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import { BackButton } from '@/components/BackButton';
import { Network, Server, Database, Activity, Box, Component } from 'lucide-react';

export default function KnowledgeGraphPage() {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const jobsRes = await fetch(`${API_BASE_URL}/repositories/jobs`, { headers }).catch(() => null);
        if (!jobsRes || !jobsRes.ok) throw new Error('Backend server is offline');
        const jobsData = await jobsRes.json();
        
        const activeJobId = typeof window !== 'undefined' ? localStorage.getItem('activeJobId') : null;
        let targetJobId = activeJobId;
        
        if (!targetJobId && jobsData.jobs && jobsData.jobs.length > 0) {
          const completedJobs = [...jobsData.jobs].reverse().filter((j: any) => j.status === 'Completed');
          if (completedJobs.length > 0) targetJobId = completedJobs[0].job_id;
        }

        if (targetJobId) {
          const jobDetailRes = await fetch(`${API_BASE_URL}/repositories/jobs/${targetJobId}`, { headers });
          if (jobDetailRes.ok) {
            const jobData = await jobDetailRes.json();
            setJob(jobData);
          }
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJob();
  }, []);

  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Helper to build a hierarchy from a flat list
  const getHierarchicalNodes = () => {
    if (job?.findings?.architecture && job.findings.architecture.length > 0) {
      return job.findings.architecture;
    }
    
    if (!job) return [];
    
    // Fallback Derivation from existing analysis data
    const nodes: any[] = [];
    
    // 1. Frontend Node
    const uiEv: any[] = [];
    if (job.metadata?.frameworks?.includes('React') || job.metadata?.frameworks?.includes('Next.js')) uiEv.push({ reference: 'Framework detected' });
    job.findings?.journeys?.forEach((j: any) => {
      j.evidence?.forEach((e: any) => {
        if (e.reference && (e.reference.includes('.tsx') || e.reference.includes('.jsx') || e.reference.includes('page'))) uiEv.push(e);
      });
    });
    
    if (uiEv.length > 0) {
      nodes.push({
        id: 'derived-frontend', name: 'Frontend', type: 'FRONTEND',
        description: 'Client-side application components and UI routes.',
        confidence: 'HIGH', evidence: uiEv.slice(0, 10), children: [], dependencies: ['derived-backend']
      });
    }

    // 2. Backend / API Node
    const apiEv: any[] = [];
    job.metadata?.api_routes?.forEach((r: any) => {
       apiEv.push({ reference: `${r.method} ${r.path}` });
    });
    job.findings?.capabilities?.forEach((c: any) => {
       c.evidence?.forEach((e: any) => {
         if (e.reference && (e.reference.includes('route') || e.reference.includes('api') || e.reference.includes('controller'))) apiEv.push(e);
       });
    });
    
    if (apiEv.length > 0) {
      nodes.push({
        id: 'derived-backend', name: 'Backend / API', type: 'BACKEND',
        description: 'Server-side API routes and business logic handlers.',
        confidence: 'HIGH', evidence: apiEv.slice(0, 10), children: [], dependencies: ['derived-db']
      });
    }
    
    // 3. Data Layer Node
    const dbEv: any[] = [];
    job.findings?.capabilities?.forEach((c: any) => {
       c.evidence?.forEach((e: any) => {
         if (e.reference && (e.reference.includes('schema') || e.reference.includes('model') || e.reference.includes('database') || e.reference.includes('table'))) dbEv.push(e);
       });
    });
    if (job.metadata?.frameworks?.includes('Prisma') || job.metadata?.frameworks?.includes('Mongoose') || job.metadata?.frameworks?.includes('PostgreSQL')) {
        dbEv.push({ reference: 'Database ORM/Driver detected' });
    }
    
    if (dbEv.length > 0) {
      nodes.push({
        id: 'derived-db', name: 'Data Layer', type: 'DATABASE',
        description: 'Database models, schemas, and queries.',
        confidence: 'HIGH', evidence: dbEv.slice(0, 10), children: [], dependencies: []
      });
    }
    
    // 4. Domain Modules (from verified capabilities)
    job.findings?.capabilities?.filter((c: any) => c.status !== 'INSUFFICIENT_EVIDENCE' && c.status !== 'Insufficient-Evidence').slice(0, 5).forEach((c: any) => {
      const name = c.name || (c.category ? c.category.replace('Capability: ', '') : 'Unknown');
      const modId = `derived-domain-${c.id || c.finding_id || Math.random()}`;
      nodes.push({
        id: modId,
        name: `${name}`,
        type: 'MODULE',
        description: c.description || c.reasoning_summary || 'Domain module derived from capabilities.',
        confidence: c.confidence || 'MEDIUM',
        evidence: c.evidence,
        children: [],
        dependencies: []
      });
      // Attach domain module to backend if it exists
      const be = nodes.find(n => n.id === 'derived-backend');
      if (be) be.children.push(modId);
    });
    
    return nodes;
  };

  const archNodes = getHierarchicalNodes();

  // Root pseudo-node just for visual
  const rootNode = { id: 'root', name: job?.project_name || 'System Root', type: 'PROJECT' };


  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 w-full animate-fade-in">
        <div className="h-10 bg-white border border-slate-200 rounded-md w-1/3 animate-pulse"></div>
        <div className="h-96 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[500px]">
        <div className="bg-rose-50 text-rose-700 p-6 rounded-xl border border-rose-200 text-center max-w-md">
          <h2 className="font-bold text-lg mb-2">Error Loading Architecture</h2>
          <p className="text-sm">{error || 'Project not found.'}</p>
        </div>
      </div>
    );
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'FRONTEND': return <Component size={20} />;
      case 'BACKEND':
      case 'API': return <Server size={20} />;
      case 'DATABASE': return <Database size={20} />;
      case 'SERVICE': return <Activity size={20} />;
      default: return <Box size={20} />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'FRONTEND': return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
      case 'BACKEND':
      case 'API': return 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100';
      case 'DATABASE': return 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100';
      case 'SERVICE': return 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100';
      default: return 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
    }
  };

  return (
    <div className="w-full px-4 md:px-8 py-8 max-w-[1400px] mx-auto animate-fade-in space-y-6 min-h-full">
      <div className="mb-8">
        <BackButton label="Back to Project Overview" href={`/dashboard/project/${job.job_id}`} className="mb-6" />
        <h1 className="text-3xl font-bold text-[#2F4156] font-serif mb-2 flex items-center gap-3">
          <Network className="text-[#567C8D]" size={32} />
          Architecture Map
        </h1>
        <p className="text-[#567C8D] font-medium">A high-level semantic topological view of the identified system architecture.</p>
      </div>

      <div className="bg-white border border-[#C8D9E6] rounded-2xl p-8 shadow-sm min-h-[500px] flex gap-8 relative">
        {/* Left Side: Map View */}
        <div className={`flex flex-col items-center flex-1 transition-all duration-300 ${selectedNode ? 'w-1/2 pr-8 border-r border-slate-200' : 'w-full'}`}>
          {archNodes.length === 0 ? (
            <div className="text-slate-400 font-medium h-full flex items-center justify-center">Insufficient evidence to map architecture nodes.</div>
          ) : (
            <div className="relative w-full flex flex-col items-center gap-12 mt-12">
              
              {/* Root Node */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-48 py-4 px-6 bg-[#2F4156] text-white rounded-xl shadow-md border border-[#1F2D3D] flex items-center justify-center gap-3 font-bold text-lg">
                  <Network size={20} />
                  {rootNode.name}
                </div>
                <div className="w-0.5 h-12 bg-slate-300"></div>
              </div>

              {/* Top-Level Entities */}
              <div className="relative w-full">
                {/* Horizontal connecting line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-slate-300" style={{ width: `${(archNodes.length - 1) * (100 / Math.max(1, archNodes.length))} %` }}></div>
                
                <div className="flex justify-center flex-wrap gap-8">
                  {archNodes.map((node: any, i: number) => (
                    <div key={node.id || i} className="flex flex-col items-center relative group">
                      <div className="w-0.5 h-8 bg-slate-300 absolute -top-8"></div>
                      <button 
                        onClick={() => setSelectedNode(node)}
                        className={`w-40 p-4 rounded-xl shadow-sm border flex flex-col items-center gap-3 transition-transform ${getColorForType(node.type)} ${selectedNode?.id === node.id ? 'ring-2 ring-indigo-500 scale-105' : 'hover:-translate-y-1'}`}
                      >
                        <div className="bg-white/50 p-3 rounded-full">
                          {getIconForType(node.type)}
                        </div>
                        <span className="font-bold text-sm text-center truncate w-full">{node.name}</span>
                        {node.evidence && node.evidence.length > 0 && (
                           <span className="text-[10px] uppercase font-bold bg-white/50 px-2 py-0.5 rounded-full">{node.evidence.length} files</span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Focused Drill-Down View */}
        {selectedNode && (
          <div className="w-1/2 pl-4 flex flex-col gap-6 animate-fade-in-up overflow-y-auto max-h-[700px] pb-8 pr-4 custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
               <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${getColorForType(selectedNode.type)}`}>
                   {getIconForType(selectedNode.type)}
                 </div>
                 <div>
                   <h2 className="text-2xl font-bold text-slate-800">{selectedNode.name}</h2>
                   <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{selectedNode.type}</div>
                 </div>
               </div>
               <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
               </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">{selectedNode.description || 'No description provided.'}</p>
              </div>

              {(selectedNode.dependencies?.length > 0 || selectedNode.children?.length > 0) && (
                <div className="grid grid-cols-2 gap-4">
                   {selectedNode.dependencies?.length > 0 && (
                     <div>
                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dependencies</h3>
                       <div className="flex flex-wrap gap-2">
                         {selectedNode.dependencies.map((depId: string) => {
                           const depNode = archNodes.find((n: any) => n.id === depId);
                           return depNode ? (
                             <span key={depId} className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded text-xs font-bold cursor-pointer hover:bg-rose-100" onClick={() => setSelectedNode(depNode)}>
                               {depNode.name}
                             </span>
                           ) : (
                             <span key={depId} className="px-2 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded text-xs">{depId}</span>
                           );
                         })}
                       </div>
                     </div>
                   )}
                   {selectedNode.children?.length > 0 && (
                     <div>
                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contains</h3>
                       <div className="flex flex-wrap gap-2">
                         {selectedNode.children.map((childId: string) => {
                           const cNode = archNodes.find((n: any) => n.id === childId);
                           return cNode ? (
                             <span key={childId} className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-xs font-bold cursor-pointer hover:bg-indigo-100" onClick={() => setSelectedNode(cNode)}>
                               {cNode.name}
                             </span>
                           ) : (
                             <span key={childId} className="px-2 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded text-xs">{childId}</span>
                           );
                         })}
                       </div>
                     </div>
                   )}
                </div>
              )}

              {selectedNode.evidence?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Evidence Files ({selectedNode.evidence.length})</h3>
                  <div className="space-y-2">
                    {selectedNode.evidence.slice(0, 5).map((ev: any, idx: number) => (
                      <div key={idx} className="text-xs font-mono bg-slate-800 text-slate-200 p-2 rounded break-all shadow-inner">
                        {ev.reference}
                      </div>
                    ))}
                    {selectedNode.evidence.length > 5 && (
                      <div className="text-xs text-slate-500 font-medium italic pl-1">
                        + {selectedNode.evidence.length - 5} more files backing this entity
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-8">
        <Link href="/dashboard/capabilities" className="btn-primary px-8 py-3 flex items-center gap-2 shadow-md">
          Next: Capability Explorer
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
        </Link>
      </div>
    </div>
  );
}
