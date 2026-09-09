'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, Youtube, Github } from 'lucide-react';
import { MountainLogo } from './public-header';

export function PublicFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#090A0C] text-neutral-400 py-14">
      <div className="mx-auto max-w-7xl px-6 space-y-12">
        {/* Top Editorial Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-10 border-b border-white/5">
          <div className="space-y-3 max-w-md">
            <Link href="/" className="flex items-center gap-2.5 group">
              <MountainLogo className="w-5 h-5 text-amber-500/80 group-hover:scale-105 transition-transform" />
              <span className="font-serif text-base font-bold text-white tracking-tight">
                The Jayant Diaries
              </span>
            </Link>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              A personal digital travel archive that transforms scattered photographs, videos, journals, places, and memories into structured cinematic journeys.
            </p>
          </div>

          {/* Quick Editorial Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-mono">
            <div className="space-y-2.5">
              <p className="text-[11px] uppercase tracking-widest text-white font-semibold">
                Archive
              </p>
              <ul className="space-y-1.5 text-neutral-400">
                <li>
                  <Link href="/journeys" className="hover:text-white transition-colors">
                    Journeys
                  </Link>
                </li>
                <li>
                  <Link href="/places" className="hover:text-white transition-colors">
                    Places
                  </Link>
                </li>
                <li>
                  <Link href="/stories" className="hover:text-white transition-colors">
                    Stories
                  </Link>
                </li>
                <li>
                  <Link href="/media" className="hover:text-white transition-colors">
                    Media Gallery
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="text-[11px] uppercase tracking-widest text-white font-semibold">
                About
              </p>
              <ul className="space-y-1.5 text-neutral-400">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    Philosophy
                  </Link>
                </li>
                <li>
                  <Link href="/studio" className="hover:text-amber-400 transition-colors">
                    Studio Workspace
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="text-[11px] uppercase tracking-widest text-white font-semibold">
                Follow
              </p>
              <ul className="space-y-1.5 text-neutral-400">
                <li>
                  <a
                    href="https://www.instagram.com/the_jayant_diaries"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-pink-400 transition-colors"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-red-400 transition-colors"
                  >
                    YouTube
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/JayantOlhyan/The-Jayant-Diaries"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Poetic Quote & Socials Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-neutral-500">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-serif italic text-neutral-300 text-sm">
              &ldquo;The world feels different when you slow down.&rdquo;
            </p>
            <p className="text-[11px] font-mono text-neutral-400">
              Not just places on a map, but moments that made me. &bull; Jayant
            </p>
          </div>

          <div className="flex items-center space-x-5">
            <a
              href="https://www.instagram.com/the_jayant_diaries"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-pink-400 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-red-400 transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/JayantOlhyan/The-Jayant-Diaries"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-neutral-600 gap-2">
          <span>&copy; {new Date().getFullYear()} The Jayant Diaries. All rights reserved.</span>
          <span>Places change. Memories stay.</span>
        </div>
      </div>
    </footer>
  );
}
