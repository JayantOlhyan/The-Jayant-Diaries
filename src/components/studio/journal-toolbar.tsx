'use client';

import * as React from 'react';

export interface JournalToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsert?: (newText: string) => void;
}

export function JournalToolbar({ textareaRef }: JournalToolbarProps) {
  const insertFormatting = (prefix: string, suffix: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const selectedText = currentVal.substring(start, end) || placeholder;

    const replacement = `${prefix}${selectedText}${suffix}`;
    textarea.value = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);

    // Trigger synthetic input event for React forms
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  };

  return (
    <div className="flex items-center gap-1 border border-b-0 border-studio-border bg-studio-elevated/70 px-2.5 py-1.5 rounded-t-md text-xs text-studio-muted">
      <button
        type="button"
        onClick={() => insertFormatting('**', '**', 'bold text')}
        className="px-2 py-1 font-bold hover:bg-studio-surface hover:text-white rounded transition-colors cursor-pointer"
        title="Bold (Ctrl+B)"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => insertFormatting('*', '*', 'italic text')}
        className="px-2 py-1 italic font-serif hover:bg-studio-surface hover:text-white rounded transition-colors cursor-pointer"
        title="Italic (Ctrl+I)"
      >
        I
      </button>
      <div className="h-4 w-px bg-studio-border mx-1" />
      <button
        type="button"
        onClick={() => insertFormatting('- ', '', 'list item')}
        className="px-2 py-1 hover:bg-studio-surface hover:text-white rounded transition-colors cursor-pointer"
        title="Bullet List"
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => insertFormatting('> ', '', 'quoted text')}
        className="px-2 py-1 hover:bg-studio-surface hover:text-white rounded transition-colors cursor-pointer font-serif italic"
        title="Quote"
      >
        &ldquo; Quote
      </button>
      <button
        type="button"
        onClick={() => insertFormatting('[', '](https://example.com)', 'link text')}
        className="px-2 py-1 hover:bg-studio-surface hover:text-white rounded transition-colors cursor-pointer"
        title="Link"
      >
        🔗 Link
      </button>
    </div>
  );
}
