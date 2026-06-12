"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const ACCEPTED_TYPES = ["PDF", "DOC", "DOCX", "TXT", "PNG", "JPG", "JPEG", "CSV"];

function getFileIcon(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return { label: "PDF", color: "#f87171", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.15)" };
  if (name.endsWith(".doc") || name.endsWith(".docx")) return { label: "DOC", color: "#a78bfa", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.15)" };
  if (name.endsWith(".txt") || name.endsWith(".csv")) return { label: "TXT", color: "#60a5fa", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.15)" };
  if (name.match(/\.(png|jpg|jpeg)$/)) return { label: "IMG", color: "#34d399", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.15)" };
  return { label: "FILE", color: "#94a3b8", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.12)" };
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / 1024).toFixed(1) + " KB";
}

export function UploadForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      await api.uploadDocuments(files);
      router.push("/dashboard");
    } catch {
      setError("Upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20" style={{
        background: 'rgba(3, 4, 7, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-[70px] flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
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
          <div>
            <h1 className="text-xl font-bold text-white leading-none">Upload Documents</h1>
            <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>
              Start the AI-powered document extraction pipeline
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto px-6 md:px-10 py-10 animate-fade-slide">
        {/* Supported formats */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {ACCEPTED_TYPES.map(type => (
            <span key={type} className="px-3 py-1 rounded-lg text-[11px] font-semibold"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-muted)',
              }}>
              .{type.toLowerCase()}
            </span>
          ))}
        </div>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("fileInput")?.click()}
          className="relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300"
          style={{
            border: `2px dashed ${isDragging ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.08)'}`,
            background: isDragging
              ? 'rgba(124,58,237,0.06)'
              : 'rgba(11,15,23,0.6)',
            boxShadow: isDragging ? '0 0 30px rgba(124,58,237,0.1), inset 0 0 30px rgba(124,58,237,0.05)' : 'none',
            transform: isDragging ? 'scale(0.99)' : 'scale(1)',
          }}
        >
          <input
            id="fileInput"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Background orb decoration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
                filter: 'blur(30px)',
              }} />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center py-14 px-8 text-center">
            {/* Upload Icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 animate-float"
              style={{
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.2)',
                color: '#a78bfa',
              }}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            <p className="text-[17px] font-semibold text-white mb-1.5">
              {isDragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              or <span style={{ color: '#a78bfa' }} className="font-semibold">click to browse</span> from your computer
            </p>

            {/* Divider */}
            <div className="flex items-center gap-4 mt-7 w-full max-w-xs">
              <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>supports</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            </div>
            <p className="text-[12px] mt-3 font-medium" style={{ color: 'var(--text-muted)' }}>
              PDF, DOC, TXT, PNG, JPG, CSV and more
            </p>
          </div>
        </div>

        {/* File Queue */}
        {files.length > 0 && (
          <div className="mt-6 animate-fade-slide">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {files.length} file{files.length > 1 ? "s" : ""} queued
                </span>
                <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
                  style={{
                    background: 'rgba(124,58,237,0.1)',
                    border: '1px solid rgba(124,58,237,0.15)',
                    color: '#a78bfa',
                  }}>
                  {formatFileSize(totalSize)} total
                </span>
              </div>
              <button
                onClick={() => setFiles([])}
                className="text-[11px] font-semibold transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
              >
                Clear all
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {files.map((file, idx) => {
                const icon = getFileIcon(file);
                return (
                  <div key={idx}
                    className="flex items-center gap-3 p-3.5 rounded-xl transition-colors group"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                    }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                      style={{ background: icon.bg, border: `1px solid ${icon.border}`, color: icon.color }}>
                      {icon.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {file.name}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); removeFile(idx); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        color: '#f87171',
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 p-4 rounded-xl flex items-start gap-3 animate-fade-slide"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
            }}>
            <svg className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ color: '#f87171' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: '#f87171' }}>{error}</p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleSubmit}
          disabled={uploading || !files.length}
          className="btn-brand w-full mt-6 py-3.5 flex items-center justify-center gap-2.5 text-[15px]"
        >
          {uploading ? (
            <>
              <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Uploading & Queuing Pipeline...</span>
            </>
          ) : (
            <>
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? "s" : ""}` : "Documents"}</span>
            </>
          )}
        </button>

        {files.length > 0 && !uploading && (
          <p className="text-center text-[11px] mt-3 font-medium" style={{ color: 'var(--text-muted)' }}>
            Files will be queued into the async processing pipeline immediately
          </p>
        )}
      </div>
    </div>
  );
}
