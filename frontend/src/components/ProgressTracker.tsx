"use client";
import { useEffect, useState } from "react";
import { useJobProgress } from "@/hooks/useJobProgress";
import { DocumentDetail, ProgressEvent } from "@/types";

const STAGE_ORDER = [
  "job_queued",
  "job_started",
  "document_parsing_started",
  "document_parsing_completed",
  "field_extraction_started",
  "field_extraction_completed",
  "job_completed",
];

const STAGE_LABELS: Record<string, { label: string; desc: string }> = {
  job_queued: { label: "Job Queued", desc: "Added to processing queue" },
  job_started: { label: "Pipeline Started", desc: "Worker picked up the job" },
  document_parsing_started: { label: "Parsing Document", desc: "Extracting raw content" },
  document_parsing_completed: { label: "Parsing Complete", desc: "Content extracted successfully" },
  field_extraction_started: { label: "Extracting Fields", desc: "AI field identification" },
  field_extraction_completed: { label: "Fields Extracted", desc: "Structured data ready" },
  job_completed: { label: "Completed", desc: "All processing done" },
};

interface LocalEvent {
  event: ProgressEvent;
  time: string;
}

export function ProgressTracker({ doc, active }: { doc: DocumentDetail; active: boolean }) {
  const { events, done } = useJobProgress(doc.id, active);
  const [localEvents, setLocalEvents] = useState<LocalEvent[]>([]);

  useEffect(() => {
    if (events.length > localEvents.length) {
      const newEvents = events.slice(localEvents.length).map(ev => ({
        event: ev,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      }));
      setLocalEvents(prev => [...prev, ...newEvents]);
    }
  }, [events, localEvents.length]);

  const getDisplayEvents = (): LocalEvent[] => {
    if (localEvents.length > 0) return localEvents;

    const fmt = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      } catch { return "--:--:--"; }
    };

    if (doc.status === "completed") {
      return [{
        event: {
          job_id: doc.id,
          event: "job_completed",
          stage: "job_completed",
          message: "Document processing completed. All fields extracted successfully.",
        },
        time: fmt(doc.updated_at || doc.created_at),
      }];
    }
    if (doc.status === "failed") {
      return [{
        event: {
          job_id: doc.id,
          event: "job_failed",
          stage: doc.processing_stage,
          message: doc.error_message || "Document processing failed during execution.",
        },
        time: fmt(doc.updated_at || doc.created_at),
      }];
    }
    return [];
  };

  const displayEvents = getDisplayEvents();
  const currentIdx = doc.status === "completed"
    ? STAGE_ORDER.length - 1
    : STAGE_ORDER.indexOf(doc.processing_stage);
  const pct = Math.round(((currentIdx + 1) / STAGE_ORDER.length) * 100);

  return (
    <div className="space-y-5">
      {/* ── Timeline ── */}
      <div className="glass-elevated p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Progress Timeline
            </span>
          </div>
          <span className="text-sm font-bold" style={{ color: '#a78bfa' }}>{pct}%</span>
        </div>

        {/* Global progress bar */}
        <div className="progress-bar mb-6">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>

        {/* Steps */}
        <div className="relative pl-8">
          <div className="timeline-line" />
          <div className="space-y-5">
            {STAGE_ORDER.map((stage, idx) => {
              let state: "completed" | "current" | "pending" | "failed" = "pending";
              if (doc.status === "completed") {
                state = "completed";
              } else {
                if (idx < currentIdx) state = "completed";
                else if (idx === currentIdx) state = doc.status === "failed" ? "failed" : "current";
                else state = "pending";
              }

              const stageInfo = STAGE_LABELS[stage];

              return (
                <div key={stage} className="relative flex items-start gap-4">
                  {/* Node */}
                  <div className="absolute left-[-31px] flex items-center justify-center w-6 h-6 mt-0.5">
                    {state === "completed" && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {state === "current" && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.4)' }}>
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#a78bfa' }} />
                      </div>
                    )}
                    {state === "failed" && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                    {state === "pending" && (
                      <div className="w-5 h-5 rounded-full"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-none"
                      style={{
                        color: state === "completed" ? 'var(--text-primary)'
                          : state === "current" ? '#a78bfa'
                          : state === "failed" ? '#f87171'
                          : 'var(--text-faint)',
                      }}>
                      {stageInfo.label}
                    </p>
                    <p className="text-[11px] mt-1 font-medium"
                      style={{ color: state === "pending" ? 'var(--text-faint)' : 'var(--text-muted)' }}>
                      {stageInfo.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Console Log ── */}
      <div className="glass-elevated p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Console Log
            </span>
          </div>
          {active && (
            <div className="flex items-center gap-2 text-[11px] font-medium" style={{ color: '#34d399' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              Live
            </div>
          )}
        </div>

        {displayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3"
            style={{ border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 12 }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ color: 'var(--text-faint)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Waiting for events...</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {displayEvents.map((ev, i) => {
              const isError = ev.event.event === "job_failed";
              const isDone = ev.event.event === "job_completed";
              return (
                <div key={i}
                  className="p-3.5 rounded-xl mono text-xs"
                  style={{
                    background: isError
                      ? 'rgba(239,68,68,0.05)'
                      : isDone
                        ? 'rgba(16,185,129,0.05)'
                        : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isError ? 'rgba(239,68,68,0.1)' : isDone ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)'}`,
                  }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: isError ? '#f87171' : isDone ? '#34d399' : '#a78bfa' }}>
                      {ev.event.event.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                      {ev.time}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-faint)' }} className="mr-1.5 select-none">›</span>
                    {ev.event.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
