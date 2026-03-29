"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/xray",   label: "MF X-Ray",    icon: "📈" },
  { href: "/fire",   label: "FIRE Planner", icon: "🔥" },
  { href: "/tax",    label: "Tax Wizard",   icon: "🧾" },
  { href: "/health", label: "Health Score", icon: "❤️" },
];

function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <rect width="30" height="30" rx="8" fill="#3b82f6" />
      <path
        d="M6 21L11.5 14L16 16.5L24 8"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="8" r="2.4" fill="white" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/[0.07]"
      style={{ background: "rgba(15, 23, 42, 0.96)", backdropFilter: "blur(14px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[62px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <LogoMark />
            <span
              className="text-[17px] font-bold tracking-tight leading-none"
              style={{ fontFamily: "var(--font-syne, sans-serif)" }}
            >
              <span className="text-white">AI Money</span>
              <span className="text-blue-400"> Mentor</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-[3px] rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/25 leading-none ml-0.5">
              Beta
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-[20px] text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-blue-400" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right — desktop */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span>🇮🇳</span>
            <span>For Indian Investors</span>
          </div>

          {/* Hamburger — mobile */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden border-t border-white/[0.07]"
          style={{ background: "rgba(15, 23, 42, 0.98)" }}
        >
          <div className="px-4 pt-3 pb-2 space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-500/15 text-blue-300 border border-blue-500/25"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.07]"
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </Link>
              );
            })}
          </div>
          <div className="px-7 pb-4 pt-1">
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>🇮🇳</span>
              <span>Built for Indian retail investors · Free & Private</span>
            </p>
          </div>
        </div>
      )}
    </nav>
  );
}
