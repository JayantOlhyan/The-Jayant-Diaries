import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { SearchOverlay } from "@/components/search/search-overlay";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B0D0E] text-cinema-text selection:bg-amber-500/30 selection:text-white">
      {/* Editorial Public Header with Mobile Overlay Drawer */}
      <PublicHeader />

      {/* Global Keyboard-Accessible Search Overlay */}
      <SearchOverlay />

      {/* Main Public Content */}
      <main className="flex-1">{children}</main>

      {/* Minimal Editorial Footer */}
      <PublicFooter />
    </div>
  );
}


