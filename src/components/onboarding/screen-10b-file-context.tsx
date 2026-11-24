/**
 * 1. Purpose: Screen 10b (Upload File or Paste Notes) for user-owned plan context intake.
 * 2. Spec Ref: Stitch UI Design Guide Category B Screen 10b & Master Build Plan v2.5.
 * 3. Called By: OnboardingWizard.
 * 4. Calls: StepHeader, PrimaryButton, /api/onboarding/limits.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, X, Check, Lock } from 'lucide-react';
import { StepHeader } from '@/components/onboarding/step-header';
import { PrimaryButton } from '@/components/ui/primary-button';
import type { OutlineMode } from '@/types/domain';

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.webp';

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Screen10bFileContextProps {
  initialFiles: File[];
  initialText: string;
  initialOutlineMode: OutlineMode;
  onBack: () => void;
  onContinue: (files: File[], pastedText: string, outlineMode: OutlineMode) => void;
}

export function Screen10bFileContext({
  initialFiles,
  initialText,
  initialOutlineMode,
  onBack,
  onContinue,
}: Readonly<Screen10bFileContextProps>) {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [pastedText, setPastedText] = useState(initialText);
  const [outlineMode, setOutlineMode] = useState<OutlineMode>(initialOutlineMode || 'FOLLOW_OUTLINE');
  const [maxFiles, setMaxFiles] = useState(1);
  const [maxFileSizeBytes, setMaxFileSizeBytes] = useState(5242880);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/onboarding/limits', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.maxFiles === 'number' && data.maxFiles >= 1) {
          setMaxFiles(data.maxFiles);
        }
        if (typeof data?.maxFileSizeBytes === 'number' && data.maxFileSizeBytes > 0) {
          setMaxFileSizeBytes(data.maxFileSizeBytes);
        }
      })
      .catch(() => {});
  }, []);

  const addCandidateFiles = (incoming: FileList | File[] | null) => {
    if (!incoming || incoming.length === 0) return;
    setError(null);
    const list = Array.from(incoming);

    for (const candidate of list) {
      if (candidate.size > maxFileSizeBytes) {
        setError(`"${candidate.name}" is too large. Max limit is ${formatFileSize(maxFileSizeBytes)} per file.`);
        return;
      }
    }

    if (maxFiles === 1) {
      setFiles([list[0]]);
      return;
    }

    const merged = [...files];
    for (const candidate of list) {
      const alreadyAdded = merged.some(
        (existing) => existing.name === candidate.name && existing.size === candidate.size
      );
      if (alreadyAdded) continue;
      if (merged.length >= maxFiles) {
        setError(`You can attach up to ${maxFiles} files.`);
        break;
      }
      merged.push(candidate);
    }
    setFiles(merged);
  };

  const handleRemoveFile = (index: number) => {
    setError(null);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addCandidateFiles(e.dataTransfer.files);
  };

  const canContinue = Boolean(files.length > 0 || pastedText.trim().length >= 15);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) {
      setError('Please attach a file or paste at least 15 characters of notes.');
      return;
    }
    if (files.length > maxFiles) {
      setError(`You can attach up to ${maxFiles} ${maxFiles === 1 ? 'file' : 'files'}.`);
      return;
    }
    onContinue(files, pastedText.trim(), outlineMode);
  };

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <div className="w-full max-w-[580px] mx-auto px-4 py-4 md:py-8 flex flex-col flex-1 pb-36">
        <StepHeader part={1} onBack={onBack} />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="rounded-[20px] border border-hairline bg-card p-5 md:p-6 shadow-none flex flex-col gap-5">
            <div>
              <h1 className="text-[20px] font-semibold leading-snug tracking-tight text-ink">
                Bring your file or notes
              </h1>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Drop your syllabus, course outline, book table of contents, or draft notes.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-ink uppercase tracking-wider">
                  Upload context {maxFiles > 1 ? 'files' : 'file'} (optional)
                </label>
                <span className="text-[11px] text-muted">
                  {files.length} / {maxFiles} {maxFiles === 1 ? 'file' : 'files'}
                </span>
              </div>

              {files.length > 0 && (
                <div className="flex flex-col gap-2">
                  {files.map((f, idx) => (
                    <div
                      key={`${f.name}-${f.size}-${idx}`}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-hairline bg-secondary-surface/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-card border border-hairline flex items-center justify-center shrink-0 text-ink">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-ink truncate">{f.name}</p>
                          <p className="text-[11px] text-muted">{formatFileSize(f.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1 rounded-full text-muted hover:text-ink hover:bg-card transition-colors cursor-pointer"
                        aria-label={`Remove ${f.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(files.length < maxFiles || maxFiles === 1 && files.length === 0) && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                    isDragging ? 'border-ink bg-secondary-surface/40' : 'border-hairline hover:border-muted bg-page/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={maxFiles > 1}
                    accept={ACCEPTED_EXTENSIONS}
                    className="hidden"
                    onChange={(e) => {
                      addCandidateFiles(e.target.files);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  />
                  <div className="h-10 w-10 rounded-full bg-secondary-surface flex items-center justify-center text-muted">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[13px] font-medium text-ink hover:underline">
                      {files.length > 0 ? 'Add another file or drag & drop' : 'Choose file or drag & drop'}
                    </span>
                    <p className="text-[11px] text-muted mt-0.5">
                      PDF, DOCX, TXT, MD, or photo · Up to {maxFiles} {maxFiles === 1 ? 'file' : 'files'}, {formatFileSize(maxFileSizeBytes)} each
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="notes-input" className="text-[12px] font-medium text-ink uppercase tracking-wider">
                  Or paste notes / outline here
                </label>
                <span className="text-[11px] text-muted">{pastedText.length} / 8000</span>
              </div>
              <textarea
                id="notes-input"
                rows={4}
                maxLength={8000}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste chapter list, weekly syllabus, key topics, or goals from your notes app..."
                className="w-full rounded-xl border border-hairline bg-page px-3.5 py-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:border-ink transition-colors resize-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-hairline">
              <span className="text-[12px] font-medium text-ink uppercase tracking-wider">
                How should Bunon use your material?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOutlineMode('FOLLOW_OUTLINE')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    outlineMode === 'FOLLOW_OUTLINE'
                      ? 'border-ink bg-secondary-surface/40 text-ink'
                      : 'border-hairline bg-card text-muted hover:text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium">Follow my exact outline</span>
                    {outlineMode === 'FOLLOW_OUTLINE' && <Check className="w-3.5 h-3.5 text-ink shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted leading-snug">
                    Preserves your chapters &amp; sequence across the milestones.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setOutlineMode('BACKGROUND_CONTEXT')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    outlineMode === 'BACKGROUND_CONTEXT'
                      ? 'border-ink bg-secondary-surface/40 text-ink'
                      : 'border-hairline bg-card text-muted hover:text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium">Use as background context</span>
                    {outlineMode === 'BACKGROUND_CONTEXT' && <Check className="w-3.5 h-3.5 text-ink shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted leading-snug">
                    Bunon designs the most realistic path to finish your goal.
                  </p>
                </button>
              </div>
            </div>

            {error && <p className="text-[12px] text-red-600 dark:text-red-400 font-medium">{error}</p>}

            <div className="flex items-center gap-2 text-[12px] text-muted pt-1">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Your file is read once to build your plan and is not stored.</span>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-30 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-[580px] border-t md:border md:rounded-2xl border-hairline bg-card/95 backdrop-blur-md p-4 pb-[env(safe-area-inset-bottom,16px)] md:bottom-6 shadow-sm">
            <PrimaryButton type="submit" disabled={!canContinue} className="w-full">
              Continue
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
