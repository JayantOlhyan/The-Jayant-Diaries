import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — The Jayant Diaries",
  description: "The philosophy, origin, and architectural manifesto of The Jayant Diaries personal travel archive.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cinema-black text-white selection:bg-cinema-accent selection:text-white pb-32">
      {/* Editorial Header */}
      <section className="border-b border-cinema-border/60 bg-gradient-to-b from-cinema-card/50 to-cinema-black/40 py-20 px-6 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <span className="text-[11px] font-semibold tracking-[0.25em] text-cinema-accent uppercase font-mono">
            Philosophy & Origin
          </span>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-tight">
            The Digital Sanctuary of a Wandering Mind
          </h1>
          <p className="mt-4 text-base sm:text-lg text-cinema-muted font-light leading-relaxed max-w-2xl">
            A permanent personal digital travel archive that transforms scattered photographs, journals, geographic coordinates, and memories into structured cinematic journeys.
          </p>
        </div>
      </section>

      {/* Main Editorial Content */}
      <div className="mx-auto max-w-4xl px-6 sm:px-10 lg:px-16 mt-16 space-y-20">
        {/* Core Manifesto Quote */}
        <div className="border-l-2 border-cinema-accent pl-8 sm:pl-10 py-3 space-y-3">
          <blockquote className="font-serif italic text-2xl sm:text-3xl text-white/95 leading-snug">
            &ldquo;Instagram shows the moments. The Jayant Diaries stores the journey.&rdquo;
          </blockquote>
          <p className="text-xs font-mono uppercase tracking-widest text-cinema-muted">
            The Core Principle of the Archive
          </p>
        </div>

        {/* Story Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 text-zinc-300 font-light text-base leading-relaxed">
          <div className="md:col-span-4 space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cinema-accent">
              01 / Why Build This
            </span>
            <h2 className="font-serif text-2xl text-white">The Ephemeral Trap</h2>
          </div>
          <div className="md:col-span-8 space-y-5">
            <p>
              In our contemporary digital ecosystem, travel memories are surrendered to fleeting social media feeds. Photos are compressed into transient squares, compressed by opaque algorithms, and buried under notifications within hours.
            </p>
            <p>
              When a journey concludes, what remains? A disjointed camera roll of thousands of uncurated files, forgotten geographic markers, and fragmented memories that fade with time.
            </p>
            <p className="text-white">
              The Jayant Diaries was conceived as an intentional resistance to that impermanence: a personal, relational, and enduring archive designed to outlive proprietary platforms.
            </p>
          </div>
        </section>

        {/* Pillars Section */}
        <section className="border-t border-cinema-border/60 pt-16">
          <div className="mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-cinema-accent">
              02 / Three Archival Pillars
            </span>
            <h2 className="font-serif text-3xl text-white mt-2">The Architecture of Memory</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-lg border border-cinema-border/60 bg-cinema-card/30 p-6 space-y-3">
              <span className="font-serif text-2xl text-cinema-accent">I.</span>
              <h3 className="font-serif text-lg text-white">Data Sovereignty</h3>
              <p className="text-xs text-cinema-muted leading-relaxed">
                Full ownership of every photograph, GPS coordinate, day log, and journal entry. Zero reliance on proprietary algorithms or ephemeral feeds.
              </p>
            </div>

            <div className="rounded-lg border border-cinema-border/60 bg-cinema-card/30 p-6 space-y-3">
              <span className="font-serif text-2xl text-cinema-accent">II.</span>
              <h3 className="font-serif text-lg text-white">Structured Storytelling</h3>
              <p className="text-xs text-cinema-muted leading-relaxed">
                Not just photo albums, but connected journeys. Day-by-day itineraries, geographical pins, altitudes, and field notes organized into a coherent narrative.
              </p>
            </div>

            <div className="rounded-lg border border-cinema-border/60 bg-cinema-card/30 p-6 space-y-3">
              <span className="font-serif text-2xl text-cinema-accent">III.</span>
              <h3 className="font-serif text-lg text-white">Cinematic Respect</h3>
              <p className="text-xs text-cinema-muted leading-relaxed">
                A dark, quiet, editorial aesthetic. High-fidelity visual presentation that lets the grandeur of the landscapes and quiet human moments breathe.
              </p>
            </div>
          </div>
        </section>

        {/* Personal Note & Signature */}
        <section className="border-t border-cinema-border/60 pt-16 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cinema-accent">
              03 / The Creator
            </span>
            <h2 className="font-serif text-2xl text-white">Jayant Olhyan</h2>
            <p className="text-xs text-cinema-muted font-mono">Software Architect • Photographer</p>
          </div>

          <div className="md:col-span-8 space-y-6">
            <p className="text-zinc-300 font-light leading-relaxed">
              I built this system because I believe that the roads we travel shape the people we become. To let those memories dissolve into the endless scroll of social platforms felt like losing a part of myself.
            </p>
            <p className="text-zinc-300 font-light leading-relaxed">
              Every route logged here, from the sub-zero high mountain passes of Ladakh to quiet coastal backwaters, represents a real chapter of life. I hope exploring this archive inspires you to slow down, disconnect from the noise, and embark on your own journeys.
            </p>

            <div className="pt-6 border-t border-cinema-border/40 flex items-center justify-between">
              <span className="font-serif italic text-white/90 text-sm">
                &ldquo;The world feels different when you slow down.&rdquo;
              </span>
              <span className="font-serif text-cinema-accent font-semibold">— Jayant</span>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <div className="rounded-xl border border-cinema-border/80 bg-cinema-card/50 p-10 text-center space-y-6">
          <h3 className="font-serif text-2xl sm:text-3xl text-white">Begin the Journey</h3>
          <p className="text-sm text-cinema-muted max-w-md mx-auto leading-relaxed">
            Step into the expeditions, explore the high-altitude passes, and experience the visual chronicle.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/journeys"
              className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-black transition-colors hover:bg-white/90"
            >
              Explore Journeys <span>→</span>
            </Link>
            <Link
              href="/media"
              className="inline-flex items-center gap-2 rounded-md border border-cinema-border bg-cinema-card/80 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:border-white/40"
            >
              The Archive
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

