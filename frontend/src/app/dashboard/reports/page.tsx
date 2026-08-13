'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import { BackButton } from '@/components/BackButton';
import { ArrowLeft } from 'lucide-react';

export default function ReportsPage() {
  const [latestJob, setLatestJob] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/repositories/jobs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          let activeJobId = null;
          if (typeof window !== 'undefined') {
            activeJobId = localStorage.getItem('activeJobId');
          }
          
          const completed = activeJobId 
            ? data.jobs?.find((j: any) => j.job_id === activeJobId)
            : [...(data.jobs || [])].reverse().find((j: any) => j.status === 'Completed');
            
          if (completed) {
            // Fetch detailed findings
            const jobId = completed.job_id;
            const [capRes, jourRes, gapRes] = await Promise.all([
              fetch(`${API_BASE_URL}/capabilities/${jobId}`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
              fetch(`${API_BASE_URL}/journeys/${jobId}`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null),
              fetch(`${API_BASE_URL}/logic-gaps/${jobId}`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => null)
            ]);

            const findings = {
              capabilities: capRes && capRes.ok ? (await capRes.json()).capabilities : [],
              journeys: jourRes && jourRes.ok ? (await jourRes.json()).journeys : [],
              gaps: gapRes && gapRes.ok ? (await gapRes.json()).logic_gaps : [],
              domains: []
            };

            setLatestJob({ ...completed, findings });
          }
        }
      } catch (err) {
        console.error("Failed to fetch jobs for reports", err);
      }
    };
    fetchJobs();
  }, []);

  const handleDownload = async (report: any) => {
    setIsGenerating(true);
    try {
      if (report.type === 'PDF') {
        const { jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        
        // Premium Header Band
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 45, 'F');
        
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`CodeAtlas Report`, 14, 24);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(report.title, 14, 34);
        
        // Metadata
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 55);

        if (latestJob) {
          doc.text(`Project Name: ${latestJob.project_name || 'Unknown Project'}`, 14, 61);
          doc.text(`Repository ID: ${latestJob.repo_id}`, 14, 67);
          doc.text(`Analysis ID: ${latestJob.job_id}`, 14, 73);

          const domains = latestJob.findings?.domains || [];
          const capabilities = latestJob.findings?.capabilities || [];
          const journeys = latestJob.findings?.journeys || [];
          const gaps = latestJob.findings?.gaps || [];
          
          const sharedTableStyles = {
            theme: 'grid' as const,
            styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, textColor: [51, 65, 85] as [number, number, number], overflow: 'linebreak' as const, halign: 'left' as const },
            headStyles: { fillColor: [30, 58, 138] as [number, number, number], textColor: 255, fontStyle: 'bold' as const },
            alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
          };

          if (report.title.includes('Blueprint')) {
             doc.setFontSize(16);
             doc.setFont('helvetica', 'bold');
             doc.setTextColor(15, 23, 42);
             doc.text("Inferred Domains", 14, 90);
             
             const dData = domains.map((d: any) => [
               d.name || d.label || (d.category ? d.category.replace('Domain: ', '') : 'Unknown'), 
               d.confidence || (d.confidence_score ? (d.confidence_score * 100).toFixed(1) + '%' : '-'),
               (d.description || d.reasoning_summary || '').replace(/&/g, 'and')
             ]);
             autoTable(doc, { 
               ...sharedTableStyles,
               startY: 95, 
               head: [['Domain', 'Confidence', 'Analysis']], 
               body: dData.length > 0 ? dData : [['No domains found', '-', '-']],
               columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 25 } }
             });
             
             let finalY = (doc as any).lastAutoTable.finalY + 15;
             if (finalY > 250) { doc.addPage(); finalY = 20; }
             
             doc.setFontSize(16);
             doc.text("Detected Capabilities", 14, finalY);
             
             const cData = capabilities
               .filter((c: any) => c.status !== 'Insufficient-Evidence' && c.implementationStatus !== 'INSUFFICIENT_EVIDENCE')
               .map((c: any) => [
                 c.name || (c.category ? c.category.replace('Capability: ', '') : 'Unknown'), 
                 c.confidence || (c.confidence_score ? (c.confidence_score * 100).toFixed(1) + '%' : '-'),
                 (c.description || c.confidence_explanation || c.reasoning_summary || '').replace(/&/g, 'and')
               ]);
               
             autoTable(doc, { 
               ...sharedTableStyles,
               startY: finalY + 5, 
               head: [['Capability', 'Confidence', 'Evidence Summary']], 
               body: cData.length > 0 ? cData : [['No capabilities found', '-', '-']],
               columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 25 } }
             });

             finalY = (doc as any).lastAutoTable.finalY + 15;
             if (finalY > 250) { doc.addPage(); finalY = 20; }
             
             doc.setFontSize(16);
             doc.text("Reconstructed User Journeys", 14, finalY);
             
             const jData = journeys
               .filter((j: any) => j.status !== 'Insufficient-Evidence' && j.status !== 'INSUFFICIENT_EVIDENCE')
               .map((j: any) => {
                 let steps = 'N/A';
                 if (j.steps && j.steps.length > 0) {
                   steps = j.steps.map((s: any) => s.label).join(' -> ');
                 } else if (j.evidence && j.evidence.length > 0) {
                   steps = j.evidence.map((e: any) => e.reference).join('\n');
                 }
                 return [
                   j.name || j.label || (j.category ? j.category.replace('Journey: ', '') : 'Unknown'), 
                   (j.description || j.reasoning_summary || '').replace(/&/g, 'and'),
                   steps
                 ];
               });
               
             autoTable(doc, { 
               ...sharedTableStyles,
               startY: finalY + 5, 
               head: [['Journey', 'Summary', 'Execution Path']], 
               body: jData.length > 0 ? jData : [['No journeys mapped', '-', '-']],
               columnStyles: { 0: { cellWidth: 40 }, 2: { cellWidth: 50 } }
             });
             
          } else if (report.title.includes('Logic Gaps')) {
             doc.setFontSize(16);
             doc.setFont('helvetica', 'bold');
             doc.setTextColor(15, 23, 42);
             doc.text("Critical Logic Gaps & Vulnerabilities", 14, 90);
             
             const gData = gaps
               .filter((g: any) => g.status !== 'Insufficient-Evidence')
               .map((g: any) => [
                 g.title || (g.category ? g.category.replace('Logic Gap: ', '').replace(/[^a-zA-Z0-9 -]/g, '').trim() : 'Unknown Gap'), 
                 g.severity || g.status || '-',
                 (g.reasoning || g.impact || g.description || g.reasoning_summary || '').replace(/[^a-zA-Z0-9 -.,()'"/]/g, '')
               ]);
               
             autoTable(doc, { 
               ...sharedTableStyles,
               startY: 95, 
               head: [['Gap Type', 'Status', 'Architectural Impact']], 
               body: gData.length > 0 ? gData : [['No logic gaps found', '-', '-']],
               headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: 'bold' as const },
               columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 25 } }
             });
          }
        } else {
          doc.setFontSize(12);
          doc.text("No completed analysis found. Please run an analysis first.", 14, 60);
        }
        
        doc.save(`${report.title.replace(/\s+/g, '_')}.pdf`);
        
      } else if (report.type === 'CSV') {
        let csv = "Category,Name,Confidence,Status,Summary\n";
        
        if (latestJob) {
          const capabilities = latestJob.findings?.capabilities || [];
          capabilities.filter((c: any) => c.status !== 'Insufficient-Evidence' && c.implementationStatus !== 'INSUFFICIENT_EVIDENCE').forEach((c: any) => {
            const name = c.name || (c.category ? c.category.replace('Capability: ', '') : 'Unknown');
            const summary = (c.description || c.confidence_explanation || c.reasoning_summary || '').replace(/"/g, '""');
            const conf = c.confidence || c.confidence_score || '';
            const stat = c.implementationStatus || c.status || '';
            csv += `Capability,"${name}",${conf},${stat},"${summary}"\n`;
          });
          if (capabilities.length === 0) {
            csv += `Status,No Data,,,\n`;
          }
        } else {
          csv += `Status,No Analysis Found,,,\n`;
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${report.title.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error("Download failed:", e);
      alert("Failed to generate report. Make sure you have completed an analysis.");
    }
    setIsGenerating(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in w-full">
      <div className="mb-10 flex flex-col items-start gap-4">
        <BackButton label="Back to Project Overview" href={latestJob ? `/dashboard/project/${latestJob.job_id}` : "/dashboard"} />
        
        <div className="flex justify-between items-end w-full">
          <div>
            <h1 className="text-3xl font-bold text-[#2F4156] font-serif mb-2">Reports & Exports</h1>
            <p className="text-[#567C8D] font-medium">Generate shareable real data reports of your repository analysis.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Architecture Blueprint', type: 'PDF', desc: 'Comprehensive breakdown of detected domains and capabilities.' },
          { title: 'Capability Heatmap', type: 'CSV', desc: 'Raw spreadsheet data mapping capabilities to source files.' },
          { title: 'Logic Gaps Summary', type: 'PDF', desc: 'Summary of missing flows and potential edge cases.' },
        ].map((report, idx) => (
          <div 
            key={idx} 
            onClick={() => handleDownload(report)}
            className="bg-white border border-[#C8D9E6] p-6 rounded-2xl group cursor-pointer hover:border-[#567C8D] hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F5EFEB] text-[#2F4156] flex items-center justify-center font-bold text-sm">
                {report.type}
              </div>
              <span className="text-xs text-[#567C8D] bg-slate-50 px-2 py-1 rounded border border-slate-200">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#2F4156] mb-2 group-hover:text-[#567C8D] transition-colors">{report.title}</h3>
            <p className="text-sm text-[#567C8D] mb-4">{report.desc}</p>
            <div className="text-[#567C8D] text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
              {isGenerating ? 'Generating...' : 'Download Report'} <span className="text-lg">→</span>
            </div>
          </div>
        ))}
      </div>
      
      {!latestJob && (
         <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium">
           No completed analysis was found. Reports generated now will be empty. Please run an analysis first.
         </div>
      )}

      <div className="flex justify-start mt-8">
        <Link href="/dashboard/gaps" className="btn-secondary px-6 py-3 flex items-center gap-2 shadow-sm bg-white border border-[#C8D9E6] text-[#567C8D] hover:bg-slate-50 font-bold rounded-lg transition-colors">
          <ArrowLeft size={20} />
          Back: Logic Gap Alerts
        </Link>
      </div>
    </div>
  );
}
