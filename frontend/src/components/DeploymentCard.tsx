'use client';
import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  GitBranch,
  FileArchive,
  Clock,
  Zap,
} from 'lucide-react';

type DeploymentStatus = 'queued' | 'building' | 'ready' | 'error';

interface DeploymentStage {
  label: string;
  status: 'completed' | 'active' | 'pending' | 'error';
  duration?: string;
}

interface DeploymentCardProps {
  projectName: string;
  source?: 'git' | 'zip';
  sourceLabel?: string;
  currentStage: string;
  stages: string[];
  error?: string;
  className?: string;
}

export function DeploymentCard({
  projectName,
  source = 'git',
  sourceLabel,
  currentStage,
  stages,
  error,
  className = '',
}: DeploymentCardProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime] = useState(() => Date.now());

  const currentIdx = stages.indexOf(currentStage);
  const isCompleted = currentStage === stages[stages.length - 1];
  const isFailed = !!error || currentStage === 'Failed';

  // Derive overall status
  let overallStatus: DeploymentStatus = 'building';
  if (isCompleted) overallStatus = 'ready';
  else if (isFailed) overallStatus = 'error';
  else if (currentIdx <= 0) overallStatus = 'queued';

  // Timer
  useEffect(() => {
    if (isCompleted || isFailed) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, isFailed, startTime]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  // Build stage list
  const deploymentStages: DeploymentStage[] = stages.map((stage, idx) => {
    let status: DeploymentStage['status'] = 'pending';
    if (isFailed && idx === currentIdx) status = 'error';
    else if (idx < currentIdx) status = 'completed';
    else if (idx === currentIdx && !isCompleted) status = 'active';
    else if (isCompleted) status = 'completed';
    return { label: stage, status };
  });

  const progressPercent = isCompleted
    ? 100
    : isFailed
      ? ((currentIdx) / (stages.length - 1)) * 100
      : ((currentIdx + 0.5) / (stages.length - 1)) * 100;

  const statusConfig = {
    queued: { label: 'Queued', color: '#567C8D', bg: 'rgba(86,124,141,0.1)', border: 'rgba(86,124,141,0.25)' },
    building: { label: 'Building', color: '#D97706', bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.25)' },
    ready: { label: 'Ready', color: '#059669', bg: 'rgba(5,150,105,0.1)', border: 'rgba(5,150,105,0.25)' },
    error: { label: 'Error', color: '#DC2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.25)' },
  };

  const cfg = statusConfig[overallStatus];

  return (
    <div className={`deployment-card ${className}`}>
      {/* Header */}
      <div className="dc-header">
        <div className="dc-header-left">
          <div className="dc-project-icon">
            {source === 'git' ? (
              <GitBranch size={18} className="text-[#567C8D]" />
            ) : (
              <FileArchive size={18} className="text-[#567C8D]" />
            )}
          </div>
          <div>
            <h3 className="dc-project-name">{projectName || 'Unnamed Project'}</h3>
            {sourceLabel && (
              <p className="dc-source-label">{sourceLabel}</p>
            )}
          </div>
        </div>
        <div
          className="dc-status-badge"
          style={{
            color: cfg.color,
            background: cfg.bg,
            borderColor: cfg.border,
          }}
        >
          {overallStatus === 'building' && (
            <Loader2 size={12} className="dc-spinner" />
          )}
          {overallStatus === 'ready' && <CheckCircle2 size={12} />}
          {overallStatus === 'error' && <XCircle size={12} />}
          {overallStatus === 'queued' && <Circle size={12} />}
          <span>{cfg.label}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="dc-progress-track">
        <div
          className="dc-progress-fill"
          style={{
            width: `${progressPercent}%`,
            background: isFailed
              ? '#DC2626'
              : isCompleted
                ? '#059669'
                : 'linear-gradient(90deg, #567C8D, #2F4156)',
          }}
        />
        {!isCompleted && !isFailed && (
          <div
            className="dc-progress-pulse"
            style={{ left: `${progressPercent}%` }}
          />
        )}
      </div>

      {/* Stages */}
      <div className="dc-stages">
        {deploymentStages.map((stage, idx) => (
          <div key={stage.label} className="dc-stage-row">
            <div className="dc-stage-icon-col">
              {stage.status === 'completed' ? (
                <div className="dc-stage-check">
                  <CheckCircle2 size={16} />
                </div>
              ) : stage.status === 'active' ? (
                <div className="dc-stage-active">
                  <Loader2 size={16} className="dc-spinner" />
                </div>
              ) : stage.status === 'error' ? (
                <div className="dc-stage-error">
                  <XCircle size={16} />
                </div>
              ) : (
                <div className="dc-stage-pending">
                  <Circle size={16} />
                </div>
              )}
              {idx < deploymentStages.length - 1 && (
                <div
                  className="dc-stage-connector"
                  style={{
                    background:
                      stage.status === 'completed' ? '#567C8D' : '#C8D9E6',
                  }}
                />
              )}
            </div>
            <div className="dc-stage-content">
              <span
                className="dc-stage-label"
                style={{
                  color:
                    stage.status === 'completed' || stage.status === 'active'
                      ? '#2F4156'
                      : stage.status === 'error'
                        ? '#DC2626'
                        : '#567C8D',
                  fontWeight: stage.status === 'active' ? 600 : 500,
                }}
              >
                {stage.label}
              </span>
              {stage.status === 'active' && (
                <span className="dc-stage-running">Running…</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="dc-error-msg">
          {error}
        </div>
      )}

      {/* Footer */}
      <div className="dc-footer">
        <div className="dc-footer-timer">
          <Clock size={14} />
          <span>{formatTime(elapsedSeconds)}</span>
        </div>
        {isCompleted && (
          <div className="dc-footer-ready">
            <Zap size={14} />
            <span>Analysis Complete</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .deployment-card {
          background: #ffffff;
          border: 1px solid #c8d9e6;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(47, 65, 86, 0.06);
          width: 100%;
          max-width: 540px;
        }

        .dc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #c8d9e6;
        }

        .dc-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .dc-project-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #f5efeb;
          border: 1px solid #c8d9e6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dc-project-name {
          font-size: 15px;
          font-weight: 700;
          color: #2f4156;
          margin: 0;
          font-family: serif;
          letter-spacing: -0.01em;
        }

        .dc-source-label {
          font-size: 12px;
          color: #567c8d;
          margin: 2px 0 0;
          font-family: monospace;
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dc-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid;
          letter-spacing: 0.02em;
          flex-shrink: 0;
        }

        .dc-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Progress bar */
        .dc-progress-track {
          width: 100%;
          height: 3px;
          background: #f5efeb;
          position: relative;
          overflow: visible;
        }

        .dc-progress-fill {
          height: 100%;
          transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
          border-radius: 0 2px 2px 0;
        }

        .dc-progress-pulse {
          position: absolute;
          top: 50%;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2f4156;
          transform: translate(-50%, -50%);
          animation: pulse-glow 1.5s ease-in-out infinite;
          box-shadow: 0 0 8px rgba(47, 65, 86, 0.4);
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.5); }
        }

        /* Stages */
        .dc-stages {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .dc-stage-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          min-height: 36px;
        }

        .dc-stage-icon-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 20px;
          flex-shrink: 0;
          position: relative;
        }

        .dc-stage-connector {
          width: 2px;
          height: 20px;
          margin-top: 2px;
          border-radius: 1px;
          transition: background 0.3s;
        }

        .dc-stage-check {
          color: #567c8d;
        }

        .dc-stage-active {
          color: #2f4156;
        }

        .dc-stage-error {
          color: #dc2626;
        }

        .dc-stage-pending {
          color: #c8d9e6;
        }

        .dc-stage-content {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 1px;
        }

        .dc-stage-label {
          font-size: 13px;
          transition: color 0.3s;
        }

        .dc-stage-running {
          font-size: 11px;
          color: #d97706;
          font-weight: 500;
          animation: fade-pulse 1.5s ease-in-out infinite;
        }

        @keyframes fade-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* Error */
        .dc-error-msg {
          margin: 0 24px 16px;
          padding: 12px 16px;
          background: rgba(220, 38, 38, 0.06);
          border: 1px solid rgba(220, 38, 38, 0.15);
          border-radius: 12px;
          color: #dc2626;
          font-size: 13px;
          font-weight: 500;
        }

        /* Footer */
        .dc-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          border-top: 1px solid #c8d9e6;
          background: #f5efeb;
        }

        .dc-footer-timer {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #567c8d;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        .dc-footer-ready {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #059669;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
