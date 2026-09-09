import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function StudioTagsPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Tags & Categories</h1>
          <p className="text-xs text-studio-muted">Manage discovery tags (e.g. Mountains, Snow, Roadtrip).</p>
        </div>
        <Button variant="primary" size="sm">
          + Add Tag
        </Button>
      </div>

      <EmptyState
        title="No tags created"
        description="Tags enable faceted search and categorization across memories, media, and stories."
      />
    </div>
  );
}
