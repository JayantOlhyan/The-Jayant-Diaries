import Link from "next/link";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { label: "Dashboard", href: "/studio/dashboard" },
    { label: "Trips", href: "/studio/trips" },
    { label: "Days", href: "/studio/days" },
    { label: "Places", href: "/studio/places" },
    { label: "Memories", href: "/studio/memories" },
    { label: "Smart Ingestion", href: "/studio/import" },
    { label: "Media Manager", href: "/studio/media" },
    { label: "Instagram", href: "/studio/instagram" },
    { label: "Map Overview", href: "/studio/map" },
    { label: "Tags", href: "/studio/tags" },
    { label: "Settings", href: "/studio/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-studio-bg text-studio-text">
      {/* Studio Sidebar */}
      <aside className="w-64 border-r border-studio-border bg-studio-surface p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-6">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-studio-muted">
              Archive Studio
            </span>
            <h2 className="text-base font-semibold text-white tracking-tight">The Jayant Diaries</h2>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center rounded-md px-3 py-2 text-xs font-medium text-studio-muted hover:bg-studio-elevated hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-studio-border pt-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-studio-muted hover:text-white transition-colors"
          >
            <span>&larr; Return to Public Archive</span>
          </Link>
        </div>
      </aside>

      {/* Main Studio Work Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-studio-border bg-studio-surface px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Studio Operational
            </span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
