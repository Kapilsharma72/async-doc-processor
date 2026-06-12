"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DocumentDetail } from "@/types";
import { ProgressTracker } from "@/components/ProgressTracker";

function formatSize(bytes: string | number) {
  const n = parseInt(String(bytes));
  if (isNaN(n)) return "–";
  if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MB";
  return (n / 1024).toFixed(1) + " KB";
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "–";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string; glow: string; label: string }> = {
  queued: { color: "#fbbf24", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", glow: "rgba(245,158,11,0.15)", label: "Queued" },
  processing: { color: "#60a5fa", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", glow: "rgba(59,130,246,0.15)", label: "Processing" },
  completed: { color: "#34d399", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", glow: "rgba(16,185,129,0.15)", label: "Completed" },
  failed: { color: "#f87171", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", glow: "rgba(239,68,68,0.15)", label: "Failed" },
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState("");
  const [saving, setSaving] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const fetchDoc = async () => {
    const data = await api.getDocument(id);
    setDoc(data);
  };

  useEffect(() => { fetchDoc(); }, [id]);

  const handleRetry = async () => {
    await api.retryJob(id);
    fetchDoc();
  };

  const handleSaveReview = async () => {
    setSaving(true);
    setJsonError(null);
    try {
      const parsed = JSON.parse(editData);
      await api.updateReview(id, parsed);
      setEditing(false);
      fetchDoc();
    } catch (err) {
      setJsonError("Invalid JSON. Please check the syntax and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    await api.finalizeDocument(id);
    fetchDoc();
  };

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(124,58,237,0.2)', borderTopColor: '#7c3aed' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Loading document details...
        </p>
      </div>
    );
  }

  const displayData = doc.reviewed_data || doc.extracted_data;
  const isActive = doc.status === "queued" || doc.status === "processing";
  const statusStyle = STATUS_STYLES[doc.status] || STATUS_STYLES.queued;

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20" style={{
        background: 'rgba(3, 4, 7, 0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-[70px] flex items-center gap-4">
          {/* Back button */}
          <button
            onClick={() => router.push("/dashboard")}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {/* Doc name */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {doc.original_filename}
            </h1>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
              ID: {doc.id} · {formatSize(doc.file_size)} · {formatDate(doc.created_at)}
            </p>
          </div>

          {/* Status badge */}
          <span
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold flex-shrink-0"
            style={{
              background: statusStyle.bg,
              border: `1px solid ${statusStyle.border}`,
              color: statusStyle.color,
              boxShadow: `0 0 15px ${statusStyle.glow}`,
            }}
          >
            {isActive && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: statusStyle.color }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5"
                  style={{ background: statusStyle.color }} />
              </span>
            )}
            {statusStyle.label}
            {doc.finalized === "true" && (
              <span className="ml-1 px-1.5 py-0.5 text-[9px] rounded-md font-bold uppercase"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
                Finalized
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 animate-fade-slide">
        {/* ── Meta bar ── */}
        <div className="glass p-4 mb-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          {[
            { label: "File Type", value: doc.file_type.replace(/_/g, " ") },
            { label: "File Size", value: formatSize(doc.file_size) },
            { label: "Created", value: formatDate(doc.created_at) },
            { label: "Stage", value: doc.processing_stage.replace(/_/g, " ") },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                {item.label}
              </p>
              <p className="text-[13px] font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Two column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: Progress */}
          <div className="lg:col-span-3">
            <ProgressTracker doc={doc} active={isActive} />
          </div>

          {/* Right: Extracted Data */}
          <div className="lg:col-span-2">
            <div className="glass-elevated h-full flex flex-col" style={{ minHeight: 400 }}>
              <div className="p-5 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Extracted Data
                  </span>
                </div>

                {doc.status === "completed" && doc.finalized !== "true" && !editing && (
                  <button
                    onClick={() => { setEditData(JSON.stringify(displayData, null, 2)); setEditing(true); }}
                    className="btn-ghost px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                )}
              </div>

              <div className="flex-1 p-5 flex flex-col">
                {displayData ? (
                  editing ? (
                    <div className="flex flex-col flex-1 gap-3">
                      <textarea
                        className="input-field flex-1 min-h-[320px] p-4 mono text-xs resize-none leading-relaxed"
                        value={editData}
                        onChange={e => { setEditData(e.target.value); setJsonError(null); }}
                        style={{ color: '#34d399' }}
                      />
                      {jsonError && (
                        <p className="text-xs font-medium" style={{ color: '#f87171' }}>{jsonError}</p>
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={handleSaveReview}
                          disabled={saving}
                          className="btn-brand flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
                        >
                          {saving ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : "Save Changes"}
                        </button>
                        <button
                          onClick={() => { setEditing(false); setJsonError(null); }}
                          className="btn-ghost px-5 py-2.5 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <pre
                      className="mono text-xs leading-relaxed flex-1 overflow-auto max-h-[500px] rounded-xl p-4"
                      style={{
                        background: 'rgba(4,6,10,0.6)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        color: '#34d399',
                      }}
                    >
                      <code>{JSON.stringify(displayData, null, 2)}</code>
                    </pre>
                  )
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 rounded-xl"
                    style={{ border: '1px dashed rgba(255,255,255,0.05)' }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-float"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        style={{ color: 'var(--text-faint)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-center" style={{ color: 'var(--text-secondary)' }}>
                      Awaiting extraction
                    </p>
                    <p className="text-[12px] text-center max-w-[200px]" style={{ color: 'var(--text-muted)' }}>
                      Extracted fields will appear here once processing completes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        {/* Failed */}
        {doc.status === "failed" && (
          <div className="mt-5 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 animate-fade-slide"
            style={{
              background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.15)',
            }}>
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Processing Failed</h4>
                <p className="text-[13px] mt-1 leading-relaxed" style={{ color: '#f87171' }}>
                  {doc.error_message || "An error occurred during processing."}
                </p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)';
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry Job
            </button>
          </div>
        )}

        {/* Finalize */}
        {doc.status === "completed" && doc.finalized !== "true" && (
          <button
            onClick={handleFinalize}
            className="mt-5 w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all animate-fade-slide"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.08))',
              border: '1px solid rgba(16,185,129,0.2)',
              color: '#34d399',
              boxShadow: '0 4px 15px rgba(16,185,129,0.1)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.12))';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(16,185,129,0.15)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.08))';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 15px rgba(16,185,129,0.1)';
            }}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
            </svg>
            Finalize & Lock Document
          </button>
        )}

        {/* Export */}
        {doc.finalized === "true" && (
          <div className="mt-5 grid grid-cols-2 gap-4 animate-fade-slide">
            {[
              { format: "json", label: "Export JSON", icon: "{ }" },
              { format: "csv", label: "Export CSV", icon: "," },
            ].map(({ format, label, icon }) => (
              <a
                key={format}
                href={api.exportUrl(doc.id, format)}
                className="flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-semibold transition-all"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)';
                  (e.currentTarget as HTMLElement).style.color = '#a78bfa';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.05)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)';
                }}
              >
                <span className="mono text-[11px] font-black w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', color: '#a78bfa' }}>
                  {icon}
                </span>
                {label}
                <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
