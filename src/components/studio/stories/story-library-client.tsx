'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StoryRow, TripRow } from '@/types/entities';
import { StoryStatus } from '@/types/database';
import { createStoryDraftAction, deleteStoryAction, archiveStoryAction } from '@/server/actions/story-actions';
import { Plus, Search, FileText, CheckCircle2, Clock, Archive, Trash2, Eye, Edit3, ArrowRight, X } from 'lucide-react';

interface StoryLibraryClientProps {
  initialStories: StoryRow[];
  trips: TripRow[];
}

export function StoryLibraryClient({ initialStories, trips }: StoryLibraryClientProps) {
  const router = useRouter();
  const [stories, setStories] = useState<StoryRow[]>(initialStories);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto generate slug from title
  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    const slugified = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setNewSlug(slugified);
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim()) {
      setErrorMsg('Title and slug are required.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await createStoryDraftAction({
      trip_id: selectedTripId,
      title: newTitle.trim(),
      slug: newSlug.trim(),
    });

    setIsSubmitting(false);

    if (res.success && res.story) {
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewSlug('');
      router.push(`/studio/stories/${res.story.id}`);
    } else {
      setErrorMsg(res.error || 'Failed to create story draft');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    const res = await deleteStoryAction(id);
    if (res.success) {
      setStories((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    } else {
      alert(res.error || 'Failed to delete story');
    }
  };

  const handleArchive = async (id: string) => {
    const res = await archiveStoryAction(id);
    if (res.success && res.story) {
      setStories((prev) => prev.map((s) => (s.id === id ? res.story! : s)));
      router.refresh();
    } else {
      alert(res.error || 'Failed to archive story');
    }
  };

  const getTripTitle = (tripId: string | null) => {
    if (!tripId) return 'Standalone Archive';
    const found = trips.find((t) => t.id === tripId);
    return found ? found.title : 'Journey';
  };

  const filteredStories = stories.filter((story) => {
    // Status filter
    if (activeTab !== 'ALL' && (story.status || 'DRAFT') !== activeTab) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = story.title.toLowerCase().includes(q);
      const matchSlug = story.slug.toLowerCase().includes(q);
      const tripTitle = getTripTitle(story.trip_id || null).toLowerCase();
      const matchTrip = tripTitle.includes(q);
      return matchTitle || matchSlug || matchTrip;
    }
    return true;
  });

  const getStatusBadge = (status?: StoryStatus) => {
    const st = status || 'DRAFT';
    switch (st) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <CheckCircle2 className="w-3 h-3" /> Published
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
            <Clock className="w-3 h-3" /> Ready
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
            <Archive className="w-3 h-3" /> Archived
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
            <FileText className="w-3 h-3" /> Draft
          </span>
        );
    }
  };

  const getBlockCount = (contentStr: string) => {
    try {
      const parsed = JSON.parse(contentStr);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-light text-zinc-100 tracking-wide">
            Editorial Stories
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Human-authored travel stories composed from your canonical archive.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Story
        </button>
      </div>

      {/* Controls & Filtering */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800/80 overflow-x-auto">
          {['ALL', 'DRAFT', 'READY', 'PUBLISHED', 'ARCHIVED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab === 'ALL' ? 'All Stories' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stories or journeys..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
      </div>

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-xl border border-zinc-800/50 space-y-3">
          <FileText className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-medium text-zinc-300">No stories found</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? 'No stories match your search query.'
              : activeTab !== 'ALL'
              ? `No stories currently marked as ${activeTab.toLowerCase()}.`
              : 'Compose your first travel story from your archive.'}
          </p>
          {!searchQuery && activeTab === 'ALL' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg text-sm transition-colors mt-2"
            >
              <Plus className="w-4 h-4" /> Create Draft
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => {
            const blockCount = getBlockCount(story.content);
            const tripTitle = getTripTitle(story.trip_id || null);

            return (
              <div
                key={story.id}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                      {tripTitle}
                    </span>
                    {getStatusBadge(story.status)}
                  </div>

                  <div>
                    <h3 className="text-xl font-serif font-normal text-zinc-100 group-hover:text-amber-200 transition-colors line-clamp-2">
                      {story.title}
                    </h3>
                    {story.subtitle && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 italic">
                        {story.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/60 space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                    <span>{blockCount} {blockCount === 1 ? 'block' : 'blocks'}</span>
                    <span>
                      {story.updated_at
                        ? new Date(story.updated_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Draft'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/studio/stories/${story.id}`}
                        className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </Link>
                      <Link
                        href={`/studio/stories/${story.id}/preview`}
                        className="inline-flex items-center gap-1.5 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </Link>
                    </div>

                    <div className="flex items-center gap-1">
                      {story.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleArchive(story.id)}
                          title="Archive story"
                          className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 rounded transition-colors"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(story.id, story.title)}
                        title="Delete story"
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Story Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-serif text-zinc-100">Create New Story Draft</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateDraft} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Associated Journey
                </label>
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                >
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.title} ({trip.start_date ? new Date(trip.start_date).getFullYear() : 'Archive'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Story Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. The Road to Pangong"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="e.g. the-road-to-pangong"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Draft'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
