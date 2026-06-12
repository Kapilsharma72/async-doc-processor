"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 22V12h6v10" />
      </svg>
    ),
    description: "Monitor jobs",
  },
  {
    name: "Upload",
    href: "/upload",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    description: "New document",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-[72px] md:w-[240px] flex-shrink-0 h-screen sticky top-0 z-40 flex flex-col"
      style={{
        background: 'rgba(7, 10, 16, 0.95)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div className="h-[70px] flex items-center px-4 md:px-5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <Link href="/dashboard" className="flex items-center gap-3 group w-full">
          {/* Logo Icon */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-300"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              boxShadow: '0 4px 15px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <svg className="w-5 h-5 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          {/* Brand Name — hidden on mobile */}
          <div className="hidden md:flex flex-col min-w-0">
            <span className="font-bold text-[15px] leading-none text-white tracking-tight">DocFlow</span>
            <span className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>
              AI Document Processor
            </span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1.5 mt-2">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.name}
              href={link.href}
              className="group relative flex items-center gap-3 rounded-xl transition-all duration-200"
              style={{
                padding: '10px 12px',
                background: isActive
                  ? 'rgba(124, 58, 237, 0.1)'
                  : 'transparent',
                border: `1px solid ${isActive ? 'rgba(124, 58, 237, 0.2)' : 'transparent'}`,
                color: isActive ? '#a78bfa' : 'var(--text-muted)',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                }
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #7c3aed, #2563eb)' }}
                />
              )}
              <span className="flex-shrink-0">{link.icon}</span>
              <div className="hidden md:flex flex-col min-w-0">
                <span className="text-[13px] font-semibold leading-none">{link.name}</span>
                <span className="text-[10px] mt-1 font-normal" style={{ color: 'var(--text-muted)' }}>
                  {link.description}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        {/* Version chip */}
        <div className="hidden md:flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>DocFlow v2.0</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Async Pipeline</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
