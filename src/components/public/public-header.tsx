'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, Instagram, Youtube, Github } from 'lucide-react';

export function MountainLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Mountain peaks silhouette */}
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
      <path d="M4.14 15h15.72" />
    </svg>
  );
}

export function PublicHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key and body scroll locking
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsMobileMenuOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: '/journeys', label: 'Journeys' },
    { href: '/places', label: 'Places' },
    { href: '/map', label: 'Map' },
    { href: '/stories', label: 'Stories' },
    { href: '/media', label: 'Archive' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#0B0D0E]/85 backdrop-blur-md transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Brand Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <MountainLogo className="w-5 h-5 text-amber-500/90 transition-transform group-hover:scale-105" />
            <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-white">
              The Jayant Diaries
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-9 text-xs font-medium uppercase tracking-wider">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/media'
                  ? pathname.startsWith('/media')
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1 transition-colors ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[1.5px] bg-amber-500/80 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Trigger Button */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
              className="flex items-center gap-1.5 p-2 text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              title="Search the archive (⌘K)"
              aria-label="Search archive"
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline-flex items-center text-[10px] font-mono text-neutral-400 bg-white/[0.06] border border-white/10 px-1.5 py-0.5 rounded">
                ⌘K
              </span>
            </button>

            <Link
              href="/studio"
              className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 hover:text-amber-400 transition-colors hidden sm:block"
            >
              Studio
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -mr-2 text-neutral-400 hover:text-white md:hidden transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded-lg"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fullscreen Overlay Menu (Matches Reference Spec "Mobile — Menu") */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col justify-between bg-[#0B0D0E]/95 backdrop-blur-xl p-6 md:hidden animate-fade-in"
        >
          {/* Top Bar inside Menu */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5"
            >
              <MountainLogo className="w-5 h-5 text-amber-500" />
              <span className="font-serif text-base font-bold tracking-tight text-white">
                The Jayant Diaries
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-neutral-400 hover:text-white rounded-lg focus:outline-none"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Centered Navigation Links */}
          <div className="my-auto flex flex-col items-center justify-center space-y-6 text-center py-8">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setTimeout(() => window.dispatchEvent(new CustomEvent('open-search')), 50);
              }}
              className="font-serif text-2xl font-bold tracking-wide text-amber-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </button>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-serif text-2xl font-bold tracking-wide text-neutral-200 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-serif text-2xl font-bold tracking-wide text-neutral-400 hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              href="/studio"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-xs font-mono uppercase tracking-widest text-amber-500/80 hover:text-amber-400 pt-2"
            >
              Studio Workspace ↗
            </Link>
          </div>

          {/* Bottom Social Links & Subtitle */}
          <div className="border-t border-white/10 pt-6 flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-6 text-neutral-400">
              <a
                href="https://www.instagram.com/the_jayant_diaries"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-400 transition-colors p-2"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-400 transition-colors p-2"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/JayantOlhyan/The-Jayant-Diaries"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors p-2"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
            <p className="text-[11px] font-mono text-neutral-600 text-center">
              Instagram shows the moments. The Jayant Diaries stores the journey.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
