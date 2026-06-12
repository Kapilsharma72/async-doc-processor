"use client";
import { useState } from "react";
import { useJobs } from "@/hooks/useJobs";
import Link from "next/link";
import { DocumentListItem, JobStatus } from "@/types";

/* ── helpers ── */
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
  });
}

function getFileInfo(fileType: string) {
  const t = (fileType || "").toLowerCase();
  if (t.includes("pdf"))
    return { label: "PDF", color: "#f87171", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" };
  if (t.includes("png") || t.includes("jpg") || t.includes("jpeg") || t.includes("image"))
    return { label: "IMG", color: "#34d399", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" };
  if (t.includes("txt") || t.includes("text") || t.includes("csv"))
    return { label: "TXT", color: "#60a5fa", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)" };
  if (t.includes("doc") || t.includes("docx") || t.includes("word"))
    return { label: "DOC", color: "#a78bfa", bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.2)" };
  return { label: "FILE", color: "#94a3b8", bg: "rgba(148,163,184,0.07)", border: "rgba(148,163,184,0.15)" };
}

const STATUS_COLORS: Record<JobStatus, { pill: string; dot: string }> = {
  queued:     { pill: "badge badge-queued",     dot: "#fbbf24" },
  processing: { pill: "badge badge-processing", dot: "#60a5fa" },
  completed:  { pill: "badge badge-completed",  dot: "#34d399" },
  failed:     { pill: "badge badge-failed",     dot: "#f87171" },
};

const STATUS_STRIP: Record<JobStatus, string> = {
  queued:     "linear-gradient(90deg,#f59e0b,#fbbf24)",
  processing: "linear-gradient(90deg,#3b82f6,#60a5fa)",
  completed:  "linear-gradient(90deg,#10b981,#34d399)",
  failed:     "linear-gradient(90deg,#ef4444,#f87171)",
};

interface StatCard {
  key: string;
  label: string;
  sublabel: string;
  accent: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}

const STAT_CARDS: StatCard[] = [
  {
    key: "total",
    label: "Total",
    sublabel: "Documents",
    accent: "#a78bfa",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.18)",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: "completed",
    label: "Completed",
    sublabel: "Processed",
    accent: "#34d399",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.18)",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: "processing",
    label: "Processing",
    sublabel: "In queue",
    accent: "#60a5fa",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.18)",
    icon: (
      <svg className="w-5 h-5 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    key: "failed",
    label: "Failed",
    sublabel: "Errors",
    accent: "#f87171",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.18)",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
];

const FILTER_TABS = [
  { label: "All",        value: "" },
  { label: "Queued",     value: "queued" },
  { label: "Processing", value: "processing" },
  { label: "Completed",  value: "completed" },
  { label: "Failed",     value: "failed" },
];

/* ── component ── */
export function JobsDashboard() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch]             = useState("");
  const [sortBy, setSortBy]             = useState("date_desc");

  const { jobs, loading } = useJobs(statusFilter || undefined, search || undefined);
  const { jobs: allJobs } = useJobs();

  const counts = {
    total:      allJobs.length,
    completed:  allJobs.filter(j => j.status === "completed").length,
    processing: allJobs.filter(j => j.status === "processing").length,
    failed:     allJobs.filter(j => j.status === "failed").length,
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === "date_desc") return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    if (sortBy === "date_asc")  return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    if (sortBy === "name_asc")  return (a.original_filename || "").localeCompare(b.original_filename || "");
    if (sortBy === "name_desc") return (b.original_filename || "").localeCompare(a.original_filename || "");
    if (sortBy === "size_desc") return parseInt(b.file_size || "0") - parseInt(a.file_size || "0");
    if (sortBy === "size_asc")  return parseInt(a.file_size || "0") - parseInt(b.file_size || "0");
    return 0;
  });

  return (
    <div className="min-h-screen">

      {/* ══════════ Sticky top bar ══════════ */}
      <div
        className="sticky top-0 z-20"
        style={{
          background:    "rgba(5,7,12,0.95)",
          backdropFilter:"blur(18px)",
          borderBottom:  "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-[58px] flex items-center justify-between gap-6">
          <div>
            <h1 className="text-[18px] font-bold text-white leading-none tracking-tight">
              Dashboard
            </h1>
            <p className="text-[11px] mt-[5px] font-medium" style={{ color: "var(--text-muted)" }}>
              {allJobs.length} document{allJobs.length !== 1 ? "s" : ""} · Real-time pipeline
            </p>
          </div>

          <Link
            href="/upload"
            className="btn-brand flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold"
            style={{ whiteSpace: "nowrap" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Upload
          </Link>
        </div>
      </div>

      {/* ══════════ Main content ══════════ */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-8 pb-10">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7 stagger-children">
          {STAT_CARDS.map(card => {
            const value = counts[card.key as keyof typeof counts];
            const pct   = card.key !== "total" && counts.total > 0
              ? Math.round((value / counts.total) * 100)
              : null;

            return (
              <div
                key={card.key}
                className="rounded-2xl px-4 py-3.5 flex items-center gap-4 relative overflow-hidden"
                style={{
                  background: "rgba(10,13,20,0.9)",
                  border:     `1px solid ${card.border}`,
                }}
              >
                {/* corner glow */}
                <div
                  style={{
                    position:   "absolute",
                    right:      -20,
                    bottom:     -20,
                    width:      80,
                    height:     80,
                    borderRadius:"50%",
                    background: card.accent,
                    filter:     "blur(35px)",
                    opacity:    0.2,
                    pointerEvents:"none",
                  }}
                />

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10"
                  style={{
                    background: card.bg,
                    border:     `1px solid ${card.border}`,
                    color:      card.accent,
                  }}
                >
                  {card.icon}
                </div>

                {/* Text block */}
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                    {card.label}
                  </p>
                  <p className="text-[30px] font-black leading-none tracking-tight mt-1" style={{ color: "#fff" }}>
                    {value}
                  </p>
                  {pct !== null && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-medium" style={{ color: "var(--text-faint)" }}>of total</span>
                        <span className="text-[9px] font-bold" style={{ color: card.accent }}>{pct}%</span>
                      </div>
                      <div style={{ height:2, borderRadius:99, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, borderRadius:99, background:`linear-gradient(90deg,${card.accent},${card.accent}99)`, boxShadow:`0 0 6px ${card.accent}70`, transition:"width 0.7s cubic-bezier(0.23,1,0.32,1)" }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Search + Sort bar ── */}
        <div
          className="rounded-2xl p-3 mb-5 flex flex-col sm:flex-row gap-3"
          style={{
            background: "rgba(12,16,24,0.95)",
            border:     "1px solid rgba(255,255,255,0.08)",
            boxShadow:  "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {/* Search input */}
          <div className="relative flex-1">
            <span
              className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
              style={{ color: "rgba(148,163,184,0.6)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search documents by filename..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width:        "100%",
                paddingLeft:  "2.5rem",
                paddingRight: "1rem",
                paddingTop:   "0.625rem",
                paddingBottom:"0.625rem",
                background:   "rgba(255,255,255,0.04)",
                border:       "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                color:        "var(--text-primary)",
                fontSize:     "0.8125rem",
                outline:      "none",
                fontFamily:   "inherit",
              }}
              onFocus={e => {
                (e.target as HTMLInputElement).style.borderColor = "rgba(124,58,237,0.5)";
                (e.target as HTMLInputElement).style.boxShadow   = "0 0 0 3px rgba(124,58,237,0.1)";
                (e.target as HTMLInputElement).style.background  = "rgba(255,255,255,0.06)";
              }}
              onBlur={e => {
                (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.target as HTMLInputElement).style.boxShadow   = "none";
                (e.target as HTMLInputElement).style.background  = "rgba(255,255,255,0.04)";
              }}
            />
          </div>

          {/* Sort select */}
          <div className="relative" style={{ width: "100%", maxWidth: 200 }}>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                width:         "100%",
                paddingLeft:   "0.875rem",
                paddingRight:  "2.5rem",
                paddingTop:    "0.625rem",
                paddingBottom: "0.625rem",
                background:    "rgba(255,255,255,0.04)",
                border:        "1px solid rgba(255,255,255,0.08)",
                borderRadius:  10,
                color:         "var(--text-secondary)",
                fontSize:      "0.8125rem",
                fontWeight:    500,
                outline:       "none",
                appearance:    "none",
                cursor:        "pointer",
                fontFamily:    "inherit",
              }}
            >
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
              <option value="name_asc">Name A → Z</option>
              <option value="name_desc">Name Z → A</option>
              <option value="size_desc">Largest first</option>
              <option value="size_asc">Smallest first</option>
            </select>
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {FILTER_TABS.map(tab => {
            const isActive = statusFilter === tab.value;
            const cnt      = tab.value ? counts[tab.value as keyof typeof counts] : null;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                style={{
                  display:       "inline-flex",
                  alignItems:    "center",
                  gap:           "6px",
                  padding:       "7px 14px",
                  borderRadius:  9,
                  fontSize:      "12.5px",
                  fontWeight:    isActive ? 600 : 500,
                  whiteSpace:    "nowrap",
                  cursor:        "pointer",
                  border:        `1px solid ${isActive ? "rgba(124,58,237,0.3)" : "transparent"}`,
                  background:    isActive ? "rgba(124,58,237,0.12)" : "transparent",
                  color:         isActive ? "#a78bfa" : "var(--text-muted)",
                  transition:    "all 0.18s ease",
                  outline:       "none",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLElement).style.color      = "var(--text-secondary)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color      = "var(--text-muted)";
                  }
                }}
              >
                {tab.label}
                {cnt !== null && cnt > 0 && (
                  <span
                    style={{
                      display:      "inline-flex",
                      alignItems:   "center",
                      justifyContent:"center",
                      minWidth:     18,
                      height:       18,
                      borderRadius: 99,
                      fontSize:     10,
                      fontWeight:   700,
                      background:   isActive ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.07)",
                      color:        isActive ? "#a78bfa" : "var(--text-secondary)",
                      padding:      "0 5px",
                    }}
                  >
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Document grid ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div
              className="w-11 h-11 rounded-full border-2 animate-spin"
              style={{
                borderColor:    "rgba(124,58,237,0.15)",
                borderTopColor: "#7c3aed",
              }}
            />
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              Loading documents…
            </p>
          </div>

        ) : sortedJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: "var(--text-faint)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-base" style={{ color: "var(--text-secondary)" }}>
                No documents found
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                {search || statusFilter
                  ? "Try adjusting your filters"
                  : "Upload your first document to get started"}
              </p>
            </div>
            {!search && !statusFilter && (
              <Link href="/upload" className="btn-brand px-5 py-2.5 text-sm mt-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Document
              </Link>
            )}
          </div>

        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
            {sortedJobs.map((doc: DocumentListItem) => {
              const file   = getFileInfo(doc.file_type);
              const status = STATUS_COLORS[doc.status];
              const isProc = doc.status === "processing";

              return (
                <Link key={doc.id} href={`/jobs/${doc.id}`} className="block group">
                  <div
                    className="h-full flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
                    style={{
                      background: "rgba(10,13,20,0.9)",
                      border:     "1px solid rgba(255,255,255,0.07)",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(124,58,237,0.25)";
                      el.style.transform   = "translateY(-3px)";
                      el.style.boxShadow   = "0 16px 35px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(255,255,255,0.07)";
                      el.style.transform   = "translateY(0)";
                      el.style.boxShadow   = "none";
                    }}
                  >
                    {/* Status colour strip at top */}
                    <div style={{ height: 3, background: STATUS_STRIP[doc.status], flexShrink: 0 }} />

                    <div className="p-5 flex flex-col gap-3 flex-1">
                      {/* File type badge + status badge */}
                      <div className="flex items-center justify-between">
                        <div
                          className="rounded-xl flex items-center justify-center text-[11px] font-black"
                          style={{
                            width:      40,
                            height:     40,
                            background: file.bg,
                            border:     `1px solid ${file.border}`,
                            color:      file.color,
                            flexShrink: 0,
                          }}
                        >
                          {file.label}
                        </div>

                        <span className={status.pill} style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
                          {isProc && (
                            <span className="relative flex" style={{ width:7, height:7 }}>
                              <span
                                className="animate-ping absolute inline-flex rounded-full"
                                style={{ width:"100%", height:"100%", background: status.dot, opacity:0.7 }}
                              />
                              <span
                                className="relative inline-flex rounded-full"
                                style={{ width:7, height:7, background: status.dot }}
                              />
                            </span>
                          )}
                          {doc.status}
                        </span>
                      </div>

                      {/* Filename */}
                      <p
                        className="font-semibold leading-snug line-clamp-2 flex-1 transition-colors group-hover:text-white"
                        style={{ fontSize: "13.5px", color: "var(--text-primary)" }}
                        title={doc.original_filename}
                      >
                        {doc.original_filename}
                      </p>

                      {/* Meta row */}
                      <div
                        className="flex items-center justify-between pt-3"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        <div className="flex items-center gap-1.5"
                          style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          {formatSize(doc.file_size)}
                        </div>
                        <div className="flex items-center gap-1.5"
                          style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(doc.created_at)}
                        </div>
                      </div>

                      {/* Stage pill */}
                      <div>
                        <span
                          className="inline-block text-[10px] font-semibold px-2 py-1 rounded-lg capitalize"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border:     "1px solid rgba(255,255,255,0.07)",
                            color:      "var(--text-muted)",
                          }}
                        >
                          {doc.processing_stage.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
