import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function StudioInstagramPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Instagram Integrations</h1>
          <p className="text-xs text-studio-muted">
            Attach Instagram posts and reels as external references without making Instagram canonical.
          </p>
        </div>
        <Button variant="primary" size="sm">
          + Link Instagram URL
        </Button>
      </div>

      <EmptyState
        title="No Instagram posts linked"
        description="Attach posts or reels to trips and places to provide complete journey context."
      />
    </div>
  );
}
