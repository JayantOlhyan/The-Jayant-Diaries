'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  StoryWithDetails,
  StoryBlock,
  StoryBlockType,
  TripRow,
  MediaRow,
  MemoryRow,
  PlaceRow,
  StoryReadinessResult,
} from '@/types/entities';
import { StoryStatus } from '@/types/database';
import {
  updateStoryAction,
  checkStoryReadinessAction,
  publishStoryAction,
  archiveStoryAction,
} from '@/server/actions/story-actions';
import {
  ArrowLeft,
  Save,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  BookOpen,
  MapPin,
  Quote,
  Minus,
  Type,
  Clock,
  Sparkles,
  Search,
  X,
  FileText,
} from 'lucide-react';

interface StoryEditorClientProps {
  story: StoryWithDetails;
  trips: TripRow[];
  availableMedia: MediaRow[];
  availableMemories: MemoryRow[];
  availablePlaces: PlaceRow[];
}

export function StoryEditorClient({
  story: initialStory,
  trips,
  availableMedia,
  availableMemories,
  availablePlaces,
}: StoryEditorClientProps) {
  const router = useRouter();

  // State
  const [title, setTitle] = useState(initialStory.title);
  const [slug, setSlug] = useState(initialStory.slug);
  const [subtitle, setSubtitle] = useState(initialStory.subtitle || '');
  const [tripId, setTripId] = useState(initialStory.trip_id || trips[0]?.id || '');
  const [coverMediaId, setCoverMediaId] = useState<string | null>(initialStory.cover_media_id || null);
  const [status, setStatus] = useState<StoryStatus>(initialStory.status || 'DRAFT');
  const [blocks, setBlocks] = useState<StoryBlock[]>(initialStory.parsedContent || []);

  // Readiness State
  const [readiness, setReadiness] = useState<StoryReadinessResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Save State
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals / Selection Drawer State
  const [activeMediaPickerForBlock, setActiveMediaPickerForBlock] = useState<string | 'COVER' | null>(null);
  const [activeMemoryPickerForBlock, setActiveMemoryPickerForBlock] = useState<string | null>(null);
  const [activePlacePickerForBlock, setActivePlacePickerForBlock] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  // Run readiness check
  const runReadinessCheck = useCallback(async () => {
    setIsAuditing(true);
    const res = await checkStoryReadinessAction(initialStory.id);
    setIsAuditing(false);
    if (res.success && res.readiness) {
      setReadiness(res.readiness);
    }
  }, [initialStory.id]);

  useEffect(() => {
    runReadinessCheck();
  }, [runReadinessCheck]);

  // Persist changes
  const saveStory = async (overrideStatus?: StoryStatus) => {
    setSaveState('saving');
    setErrorMessage(null);

    const nextStatus = overrideStatus || status;

    const res = await updateStoryAction(initialStory.id, {
      title: title.trim(),
      slug: slug.trim(),
      subtitle: subtitle.trim() || null,
      trip_id: tripId || null,
      cover_media_id: coverMediaId,
      status: nextStatus,
      content: blocks.map((b, idx) => ({ ...b, order: idx })),
    });

    if (res.success && res.story) {
      setStatus(res.story.status || 'DRAFT');
      setSaveState('saved');
      await runReadinessCheck();
    } else {
      setSaveState('unsaved');
      setErrorMessage(res.error || 'Failed to save story');
    }
  };

  // Debounced autosave on edit
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const markUnsaved = () => {
    setSaveState('unsaved');
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      saveStory();
    }, 2500);
  };

  // Block Manipulation
  const addBlock = (type: StoryBlockType) => {
    const newBlock: StoryBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      order: blocks.length,
      text: type === 'TEXT' || type === 'INTRO' || type === 'QUOTE' ? '' : undefined,
    };
    setBlocks((prev) => [...prev, newBlock]);
    markUnsaved();
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    markUnsaved();
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === blocks.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setBlocks(updated);
    markUnsaved();
  };

  const updateBlockText = (id: string, text: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, text } : b))
    );
    markUnsaved();
  };

  const updateBlockCaption = (id: string, caption: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, caption } : b))
    );
    markUnsaved();
  };

  const handleSelectMediaForBlock = (mediaId: string) => {
    if (activeMediaPickerForBlock === 'COVER') {
      setCoverMediaId(mediaId);
    } else if (activeMediaPickerForBlock) {
      setBlocks((prev) =>
        prev.map((b) => (b.id === activeMediaPickerForBlock ? { ...b, media_id: mediaId } : b))
      );
    }
    setActiveMediaPickerForBlock(null);
    setModalSearch('');
    markUnsaved();
  };

  const handleSelectMemoryForBlock = (memoryId: string) => {
    if (activeMemoryPickerForBlock) {
      setBlocks((prev) =>
        prev.map((b) => (b.id === activeMemoryPickerForBlock ? { ...b, memory_id: memoryId } : b))
      );
    }
    setActiveMemoryPickerForBlock(null);
    setModalSearch('');
    markUnsaved();
  };

  const handleSelectPlaceForBlock = (placeId: string) => {
    if (activePlacePickerForBlock) {
      setBlocks((prev) =>
        prev.map((b) => (b.id === activePlacePickerForBlock ? { ...b, place_id: placeId } : b))
      );
    }
    setActivePlacePickerForBlock(null);
    setModalSearch('');
    markUnsaved();
  };

  // Publication Handlers
  const handlePublish = async () => {
    if (!readiness?.isReady) {
      alert(`Cannot publish story: ${readiness?.reasons.join(', ')}`);
      return;
    }
    const res = await publishStoryAction(initialStory.id);
    if (res.success && res.story) {
      setStatus('PUBLISHED');
      router.refresh();
      await runReadinessCheck();
    } else {
      alert(res.error || 'Failed to publish story');
    }
  };

  const handleArchive = async () => {
    const res = await archiveStoryAction(initialStory.id);
    if (res.success && res.story) {
      setStatus('ARCHIVED');
      router.refresh();
      await runReadinessCheck();
    } else {
      alert(res.error || 'Failed to archive story');
    }
  };

  // Selected Cover Media Object
  const coverMediaObj = availableMedia.find((m) => m.id === coverMediaId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/studio/stories"
            className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-serif font-medium text-zinc-100 truncate max-w-md">
                {title || 'Untitled Story'}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-zinc-400">
                {status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono">
              /stories/{slug || 'slug'}
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          {/* Save status badge */}
          <div className="text-xs font-mono text-zinc-500 px-2 py-1">
            {saveState === 'saving' && <span className="text-amber-400">Saving...</span>}
            {saveState === 'saved' && <span className="text-emerald-400">Saved</span>}
            {saveState === 'unsaved' && <span className="text-zinc-400">Unsaved changes</span>}
          </div>

          <Link
            href={`/studio/stories/${initialStory.id}/preview`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-medium text-zinc-300 transition-colors border border-zinc-800"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </Link>

          <button
            onClick={() => saveStory()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium text-zinc-200 transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>

          {status === 'PUBLISHED' ? (
            <button
              onClick={handleArchive}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
            >
              Unpublish / Archive
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={!readiness?.isReady}
              title={!readiness?.isReady ? readiness?.reasons.join(', ') : 'Publish Story'}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Publish Story
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Story Editor Content & Blocks (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {errorMessage && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Core Metadata Fields */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-5">
            <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-2">
              Story Meta
            </h2>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Story Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  markUnsaved();
                }}
                placeholder="Story Title"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-lg font-serif text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    markUnsaved();
                  }}
                  placeholder="story-slug"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Associated Journey</label>
                <select
                  value={tripId}
                  onChange={(e) => {
                    setTripId(e.target.value);
                    markUnsaved();
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.start_date ? new Date(t.start_date).getFullYear() : 'Archive'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Intro / Subtitle</label>
              <textarea
                value={subtitle}
                onChange={(e) => {
                  setSubtitle(e.target.value);
                  markUnsaved();
                }}
                rows={2}
                placeholder="A brief intro or subtitle for the story..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
              />
            </div>

            {/* Cover Media Selector */}
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Cover Media</label>
              {coverMediaObj ? (
                <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {coverMediaObj.storage_path ? (
                      <img
                        src={`/api/media/${coverMediaObj.id}`}
                        alt="Cover"
                        className="w-12 h-12 object-cover rounded bg-zinc-900"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-zinc-200">
                        {coverMediaObj.filename || 'Media Item'}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500">
                        Visibility: {coverMediaObj.visibility}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveMediaPickerForBlock('COVER')}
                    className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded"
                  >
                    Change Cover
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveMediaPickerForBlock('COVER')}
                  className="w-full border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 rounded-lg py-4 text-xs text-zinc-400 flex items-center justify-center gap-2 transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-zinc-500" /> Select Cover Media from Archive
                </button>
              )}
            </div>
          </div>

          {/* Story Composition Blocks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h2 className="text-sm font-serif font-medium text-zinc-200">Story Composition</h2>
              <span className="text-xs font-mono text-zinc-500">{blocks.length} Blocks</span>
            </div>

            {blocks.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl space-y-2">
                <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">No blocks added yet.</p>
                <p className="text-[11px] text-zinc-600">
                  Select a block type below to begin writing your story.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {blocks.map((block, index) => {
                  const mediaObj = block.media_id
                    ? availableMedia.find((m) => m.id === block.media_id)
                    : null;
                  const memoryObj = block.memory_id
                    ? availableMemories.find((m) => m.id === block.memory_id)
                    : null;
                  const placeObj = block.place_id
                    ? availablePlaces.find((p) => p.id === block.place_id)
                    : null;

                  return (
                    <div
                      key={block.id}
                      className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4 space-y-3 relative group"
                    >
                      {/* Block Controls Header */}
                      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase">
                            0{index + 1} • {block.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveBlock(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-30 rounded hover:bg-zinc-800"
                            title="Move Up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveBlock(index, 'down')}
                            disabled={index === blocks.length - 1}
                            className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-30 rounded hover:bg-zinc-800"
                            title="Move Down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeBlock(block.id)}
                            className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-zinc-800 ml-1"
                            title="Remove Block"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Block Content Inputs based on Block Type */}
                      {block.type === 'TEXT' && (
                        <textarea
                          value={block.text || ''}
                          onChange={(e) => updateBlockText(block.id, e.target.value)}
                          rows={4}
                          placeholder="Write paragraph text..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                        />
                      )}

                      {block.type === 'INTRO' && (
                        <textarea
                          value={block.text || ''}
                          onChange={(e) => updateBlockText(block.id, e.target.value)}
                          rows={2}
                          placeholder="Opening section lead paragraph..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-base font-serif italic text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                        />
                      )}

                      {block.type === 'QUOTE' && (
                        <textarea
                          value={block.text || ''}
                          onChange={(e) => updateBlockText(block.id, e.target.value)}
                          rows={2}
                          placeholder="Pull quote or key reflection..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-serif italic text-amber-200/90 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                        />
                      )}

                      {block.type === 'DIVIDER' && (
                        <div className="py-2 text-center text-zinc-600 font-mono text-xs">
                          ─ Section Divider ─
                        </div>
                      )}

                      {block.type === 'MEDIA' && (
                        <div className="space-y-3">
                          {mediaObj ? (
                            <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                              {mediaObj.storage_path ? (
                                <img
                                  src={`/api/media/${mediaObj.id}`}
                                  alt="Media"
                                  className="w-16 h-16 object-cover rounded bg-zinc-900"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-zinc-900 rounded flex items-center justify-center text-zinc-500">
                                  <ImageIcon className="w-6 h-6" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-zinc-200 truncate">
                                  {mediaObj.filename || 'Media Item'}
                                </p>
                                <p className="text-[10px] text-zinc-500 font-mono">
                                  {mediaObj.type} • {mediaObj.visibility}
                                </p>
                              </div>
                              <button
                                onClick={() => setActiveMediaPickerForBlock(block.id)}
                                className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded"
                              >
                                Replace
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setActiveMediaPickerForBlock(block.id)}
                              className="w-full border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 rounded-lg py-3 text-xs text-zinc-400 flex items-center justify-center gap-2"
                            >
                              <ImageIcon className="w-4 h-4" /> Select Media from Archive
                            </button>
                          )}

                          <input
                            type="text"
                            value={block.caption || ''}
                            onChange={(e) => updateBlockCaption(block.id, e.target.value)}
                            placeholder="Optional media caption..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                          />
                        </div>
                      )}

                      {block.type === 'MEMORY' && (
                        <div>
                          {memoryObj ? (
                            <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="text-xs font-medium text-zinc-200">
                                    {memoryObj.title}
                                  </span>
                                </div>
                                {memoryObj.journal && (
                                  <p className="text-[11px] text-zinc-400 line-clamp-1 italic">
                                    &ldquo;{memoryObj.journal}&rdquo;
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => setActiveMemoryPickerForBlock(block.id)}
                                className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded"
                              >
                                Replace
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setActiveMemoryPickerForBlock(block.id)}
                              className="w-full border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 rounded-lg py-3 text-xs text-zinc-400 flex items-center justify-center gap-2"
                            >
                              <BookOpen className="w-4 h-4 text-amber-400" /> Select Memory from Archive
                            </button>
                          )}
                        </div>
                      )}

                      {block.type === 'PLACE' && (
                        <div>
                          {placeObj ? (
                            <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-xs font-medium text-zinc-200">
                                    {placeObj.name}
                                  </span>
                                </div>
                                <span className="text-[11px] text-zinc-500 font-mono block">
                                  {[placeObj.city, placeObj.state, placeObj.country].filter(Boolean).join(', ')}
                                </span>
                              </div>
                              <button
                                onClick={() => setActivePlacePickerForBlock(block.id)}
                                className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded"
                              >
                                Replace
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setActivePlacePickerForBlock(block.id)}
                              className="w-full border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 rounded-lg py-3 text-xs text-zinc-400 flex items-center justify-center gap-2"
                            >
                              <MapPin className="w-4 h-4 text-emerald-400" /> Select Place from Archive
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Block Bar */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Add Block to Story
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => addBlock('TEXT')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition-colors"
                >
                  <Type className="w-3.5 h-3.5 text-blue-400" /> Text
                </button>
                <button
                  onClick={() => addBlock('INTRO')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Intro Lead
                </button>
                <button
                  onClick={() => addBlock('MEDIA')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> Media Image
                </button>
                <button
                  onClick={() => addBlock('MEMORY')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" /> Memory
                </button>
                <button
                  onClick={() => addBlock('PLACE')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Place
                </button>
                <button
                  onClick={() => addBlock('QUOTE')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition-colors"
                >
                  <Quote className="w-3.5 h-3.5 text-rose-400" /> Quote
                </button>
                <button
                  onClick={() => addBlock('DIVIDER')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition-colors"
                >
                  <Minus className="w-3.5 h-3.5 text-zinc-400" /> Divider
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Readiness & Status Auditor (1 col) */}
        <div className="space-y-6">
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-5 space-y-4 sticky top-24">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-serif font-medium text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Story Readiness Audit
              </h3>
              <button
                onClick={runReadinessCheck}
                disabled={isAuditing}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 underline font-mono"
              >
                {isAuditing ? 'Auditing...' : 'Re-check'}
              </button>
            </div>

            {readiness ? (
              <div className="space-y-4">
                <div
                  className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                    readiness.isReady
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {readiness.isReady ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>READY TO PUBLISH</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>ACTION REQUIRED BEFORE PUBLISH</span>
                    </>
                  )}
                </div>

                {/* Audit Items */}
                <ul className="space-y-2 text-xs font-mono">
                  <li className="flex items-center justify-between text-zinc-300">
                    <span>Title & Slug</span>
                    {readiness.hasTitle && readiness.hasSlug ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-rose-400">✗</span>
                    )}
                  </li>
                  <li className="flex items-center justify-between text-zinc-300">
                    <span>Story Content</span>
                    {readiness.hasContent ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-rose-400">✗</span>
                    )}
                  </li>
                  <li className="flex items-center justify-between text-zinc-300">
                    <span>Cover Media Selected</span>
                    {readiness.hasCover ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-rose-400">✗</span>
                    )}
                  </li>
                  <li className="flex items-center justify-between text-zinc-300">
                    <span>Cover Media Public</span>
                    {readiness.isCoverPublic ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-rose-400">✗</span>
                    )}
                  </li>
                  <li className="flex items-center justify-between text-zinc-300">
                    <span>Referenced Media Public</span>
                    {readiness.areMediaPublic ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-rose-400">✗</span>
                    )}
                  </li>
                  <li className="flex items-center justify-between text-zinc-300">
                    <span>Referenced Places Public</span>
                    {readiness.arePlacesPublic ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-rose-400">✗</span>
                    )}
                  </li>
                  <li className="flex items-center justify-between text-zinc-300">
                    <span>Journey Publishable</span>
                    {readiness.isTripPublishable ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-rose-400">✗</span>
                    )}
                  </li>
                </ul>

                {!readiness.isReady && readiness.reasons.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800 space-y-1">
                    <span className="text-[11px] font-mono text-rose-400 uppercase">Missing:</span>
                    <ul className="list-disc list-inside text-xs text-rose-300/90 space-y-1">
                      {readiness.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 font-mono py-4 text-center">
                Running readiness auditor...
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Drawer / Modal for Media Selection */}
      {activeMediaPickerForBlock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-serif text-zinc-100">
                Select Media from Archive
              </h3>
              <button
                onClick={() => setActiveMediaPickerForBlock(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Filter media by filename..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {availableMedia
                .filter((m) =>
                  modalSearch
                    ? (m.filename || '').toLowerCase().includes(modalSearch.toLowerCase())
                    : true
                )
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMediaForBlock(m.id)}
                    className="bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg p-2 text-left space-y-2 group transition-all"
                  >
                    {m.storage_path ? (
                      <img
                        src={`/api/media/${m.id}`}
                        alt="Media"
                        className="w-full h-24 object-cover rounded bg-zinc-900"
                      />
                    ) : (
                      <div className="w-full h-24 bg-zinc-900 rounded flex items-center justify-center text-zinc-600">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-zinc-200 truncate group-hover:text-amber-200">
                        {m.filename || 'Media'}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500">{m.visibility}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Drawer / Modal for Memory Selection */}
      {activeMemoryPickerForBlock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-serif text-zinc-100">
                Select Memory from Archive
              </h3>
              <button
                onClick={() => setActiveMemoryPickerForBlock(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Search memories..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pt-2">
              {availableMemories
                .filter((mem) =>
                  modalSearch
                    ? mem.title.toLowerCase().includes(modalSearch.toLowerCase()) ||
                      (mem.journal || '').toLowerCase().includes(modalSearch.toLowerCase())
                    : true
                )
                .map((mem) => (
                  <button
                    key={mem.id}
                    onClick={() => handleSelectMemoryForBlock(mem.id)}
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg p-3 text-left space-y-1 group transition-colors"
                  >
                    <p className="text-xs font-medium text-zinc-200 group-hover:text-amber-200">
                      {mem.title}
                    </p>
                    {mem.journal && (
                      <p className="text-[11px] text-zinc-400 line-clamp-2 italic">
                        &ldquo;{mem.journal}&rdquo;
                      </p>
                    )}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Drawer / Modal for Place Selection */}
      {activePlacePickerForBlock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-serif text-zinc-100">
                Select Place from Archive
              </h3>
              <button
                onClick={() => setActivePlacePickerForBlock(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Search places..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pt-2">
              {availablePlaces
                .filter((p) =>
                  modalSearch
                    ? p.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
                      (p.city || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
                      (p.country || '').toLowerCase().includes(modalSearch.toLowerCase())
                    : true
                )
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlaceForBlock(p.id)}
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg p-3 text-left space-y-1 group transition-colors"
                  >
                    <p className="text-xs font-medium text-zinc-200 group-hover:text-amber-200">
                      {p.name}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-500">
                      {[p.city, p.state, p.country].filter(Boolean).join(', ')}
                    </p>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
