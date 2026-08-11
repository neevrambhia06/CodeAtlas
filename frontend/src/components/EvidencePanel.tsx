import { ArrowRight } from 'lucide-react';

interface Evidence {
  evidence_id: string;
  source_type: string;
  reference: string;
  snippet_or_description: string;
}

interface Finding {
  finding_id: string;
  category: string;
  confidence_score: number;
  reasoning_summary: string;
  evidence: Evidence[];
  status: 'Confirmed' | 'Low-Confidence' | 'Insufficient-Evidence' | string;
}

export default function EvidencePanel({ finding }: { finding: Finding }) {
  const { status, confidence_score, reasoning_summary, evidence } = finding;
  
  if (status === 'Insufficient-Evidence' || !evidence || evidence.length === 0) {
    return (
      <div className="bg-bgbase border border-dashed border-bordercolor rounded-lg p-5 mt-4 opacity-75">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-textmuted bg-surface px-2 py-0.5 rounded border border-bordercolor">Low Signal</span>
          <span className="text-xs font-semibold text-textmuted">Insufficient Evidence (0%)</span>
        </div>
        <p className="text-sm text-textmuted italic">{reasoning_summary}</p>
      </div>
    );
  }

  const isHigh = confidence_score >= 0.8;
  const isMedium = confidence_score >= 0.5 && confidence_score < 0.8;
  
  const scoreBadge = isHigh 
    ? 'bg-success/10 text-success border border-success/20'
    : isMedium
      ? 'bg-warning/10 text-warning border border-warning/20'
      : 'bg-error/10 text-error border border-error/20';
      
  const scoreLabel = isHigh ? 'High Confidence' : isMedium ? 'Medium Confidence' : 'Low Confidence';

  return (
    <div className="bg-surface border border-bordercolor rounded-lg p-5 mt-4 shadow-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-bold text-primary flex items-center gap-2">
          <span className="text-secondary">🔍</span> Reasoning & Evidence
        </h3>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${scoreBadge}`}>
          {scoreLabel} ({(confidence_score * 100).toFixed(0)}%)
        </span>
      </div>
      
      <p className="text-sm text-textmain font-medium leading-relaxed mb-4">{reasoning_summary}</p>
      
      <div className="space-y-3 border-t border-bordercolor/50 pt-4">
        {evidence.map((ev, idx) => (
          <div key={idx} className="flex items-start gap-3 bg-bgbase p-3 rounded-md border border-bordercolor/50 hover:border-secondary/30 transition-colors cursor-pointer group">
            <ArrowRight className="text-secondary mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity" size={16} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary bg-secondary/10 px-2 py-0.5 rounded">
                  {ev.source_type}
                </span>
                <span className="font-mono text-sm font-semibold text-primary group-hover:text-secondary transition-colors break-all">
                  {ev.reference}
                </span>
              </div>
              <p className="text-xs text-textmuted leading-relaxed mt-1">{ev.snippet_or_description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
