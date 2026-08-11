'use client';
import React, { useEffect, useState } from 'react';
import { RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TimedUndoActionProps {
  itemTitle: string;
  durationSeconds?: number;
  onConfirmDelete: () => void;
  onCancelUndo: () => void;
}

export function TimedUndoAction({
  itemTitle,
  durationSeconds = 5,
  onConfirmDelete,
  onCancelUndo,
}: TimedUndoActionProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isUndone, setIsUndone] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      onConfirmDelete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onConfirmDelete]);

  const handleUndo = () => {
    setIsUndone(true);
    onCancelUndo();
  };

  if (!mounted) return null;

  const progressPercent = ((durationSeconds - timeLeft) / durationSeconds) * 100;

  if (isUndone) {
    return createPortal(
      <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#FFFFFF] border border-[#C8D9E6] shadow-xl animate-fade-in text-sm font-semibold text-[#2F4156]">
        <CheckCircle2 size={18} className="text-[#567C8D]" />
        <span>Deletion canceled for &quot;{itemTitle}&quot;</span>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col overflow-hidden rounded-2xl bg-[#2F4156] text-[#FFFFFF] border border-[#567C8D] shadow-2xl animate-fade-in min-w-[320px]">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
            <Trash2 size={16} />
          </div>
          <div>
            <div className="text-xs font-medium text-[#C8D9E6]/75">Deleting in {timeLeft}s</div>
            <div className="text-sm font-bold truncate max-w-[180px]">{itemTitle}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUndo}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFFFFF] text-[#2F4156] text-xs font-bold hover:bg-[#C8D9E6] transition-colors shadow-sm cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>Undo</span>
        </button>
      </div>

      {/* Countdown Progress Bar */}
      <div className="w-full bg-[#567C8D]/30 h-1">
        <div
          className="bg-[#C8D9E6] h-full transition-all duration-1000 ease-linear"
          style={{ width: `${100 - progressPercent}%` }}
        />
      </div>
    </div>,
    document.body
  );
}
