/**
 * 1. Purpose: Composes Dedicated Page 50a (What Bunon Knows) with horizontal sliding tabs.
 * 2. Spec Ref: Stitch what_bunon_knows & Page 50a in UI Design Guide.
 * 3. Called By: /what-bunon-knows page.
 * 4. Calls: AppShell, WeekStrip, MemoryItemRow, TellBunonSheet, PrimaryButton.
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Sparkles, Info } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { PrimaryButton } from '@/components/ui/primary-button';
import { WeekStrip } from './week-strip';
import { MemoryItemRow } from './memory-item-row';
import { TellBunonSheet } from './tell-bunon-sheet';
import { useWhatBunonKnows } from './use-what-bunon-knows';
import type { WhatBunonKnowsResponse } from '@/lib/services/context-service';

const ABOUT_ME_BOOSTERS = [
  'Busy on Saturday mornings',
  'Deep work block on Tuesday evening',
  'Learning faster with hands-on practice',
];

export function WhatBunonKnowsView({
  initialData,
}: Readonly<{
  initialData: WhatBunonKnowsResponse;
}>) {
  const router = useRouter();
  const {
    data,
    activeTab,
    setActiveTab,
    sheetOpen,
    setSheetOpen,
    prefillBooster,
    setPrefillBooster,
    toastMessage,
    handleUpdateDayTimeMap,
    handleAddFact,
    handleUpdateItem,
    handleDeleteItem,
  } = useWhatBunonKnows(initialData);

  const currentGoal = data.goals.find((g) => g.id === activeTab);
  const isAboutMe = activeTab === 'about-me';
  const activeItems = isAboutMe
    ? data.aboutMe.items
    : currentGoal?.journeyMemory.items || [];
  const boosters: string[] = isAboutMe
    ? ABOUT_ME_BOOSTERS
    : currentGoal?.missingContextBoosters || [];

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[428px] flex-col pb-40 md:max-w-[640px] md:pb-28">
        {/* Header */}
        <header className="flex h-14 items-center justify-between px-4 border-b border-hairline">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-start text-ink hover:text-muted transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-[17px] font-semibold text-ink text-center flex-1 truncate">
            What Bunon Knows
          </h1>
          <div className="w-11" />
        </header>

        {/* Horizontal Sliding Tab Bar */}
        <nav
          aria-label="Context tabs"
          className="flex items-center gap-6 overflow-x-auto border-b border-hairline bg-card px-4 select-none scrollbar-none"
        >
          <button
            type="button"
            onClick={() => setActiveTab('about-me')}
            className={`relative py-3.5 text-[14px] whitespace-nowrap transition-colors cursor-pointer ${
              isAboutMe ? 'font-semibold text-ink' : 'font-normal text-muted hover:text-ink'
            }`}
          >
            About me
            {isAboutMe && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ink" />
            )}
          </button>

          {data.goals.map((g) => {
            const isActive = activeTab === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveTab(g.id)}
                className={`relative py-3.5 text-[14px] whitespace-nowrap transition-colors cursor-pointer ${
                  isActive ? 'font-semibold text-ink' : 'font-normal text-muted hover:text-ink'
                }`}
              >
                {g.title}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ink" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        <div className="flex flex-col gap-6 p-4">
          {/* About Me Week Schedule */}
          {isAboutMe && (
            <section className="flex flex-col gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Typical week rhythm
              </span>
              <WeekStrip
                dayTimeMap={data.dayTimeMap}
                onChange={handleUpdateDayTimeMap}
              />
            </section>
          )}

          {/* Goal Category / Pacing Badge */}
          {!isAboutMe && currentGoal && (
            <div className="flex items-center justify-between rounded-xl bg-card border border-hairline p-3">
              <span className="text-[12px] font-medium text-muted">Goal Category</span>
              <span className="text-[12px] font-semibold text-ink px-2.5 py-0.5 rounded-full bg-canvas border border-hairline">
                {currentGoal.category}
              </span>
            </div>
          )}

          {/* Facts list */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                {isAboutMe ? 'Personal rules & schedule' : 'Goal learnings & facts'}
              </span>
              <span className="text-[12px] text-muted">
                {activeItems.length} {activeItems.length === 1 ? 'rule' : 'rules'}
              </span>
            </div>

            {activeItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline p-8 text-center bg-card">
                <Info size={24} className="text-muted/60 mb-2" />
                <p className="text-[14px] font-medium text-ink">No specific rules recorded yet</p>
                <p className="text-[12px] text-muted mt-1 max-w-[280px]">
                  Add constraints, preferences, or working patterns so Bunon plans around your life.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeItems.map((item) => (
                  <MemoryItemRow
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Booster Chips */}
          {boosters.length > 0 && (
            <section className="flex flex-col gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Sparkles size={13} className="text-muted" />
                Add something you haven't told Bunon
              </span>
              <div className="flex flex-wrap gap-2">
                {boosters.map((booster) => (
                  <button
                    key={booster}
                    type="button"
                    onClick={() => {
                      setPrefillBooster(booster);
                      setSheetOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-hairline bg-card px-3 py-1.5 text-[12px] text-ink hover:border-ink transition-colors cursor-pointer"
                  >
                    <Plus size={12} className="text-muted" />
                    <span>{booster}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 md:bottom-0 md:left-[250px] md:right-0 border-t border-hairline bg-card/95 backdrop-blur-md md:pb-[env(safe-area-inset-bottom,0px)]">
          <div className="mx-auto max-w-[428px] p-4 md:max-w-[640px]">
            <PrimaryButton
              type="button"
              onClick={() => {
                setPrefillBooster('');
                setSheetOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span>Tell Bunon something new</span>
            </PrimaryButton>
          </div>
        </div>

        {/* Tell Bunon Input Sheet */}
        <TellBunonSheet
          isOpen={sheetOpen}
          initialText={prefillBooster}
          scope={isAboutMe ? 'PERSON' : 'GOAL'}
          onDismiss={() => setSheetOpen(false)}
          onSave={handleAddFact}
        />

        {/* Lightweight notification toast */}
        {toastMessage && (
          <div className="fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom,0px))] md:bottom-24 left-1/2 md:left-[calc(50%+125px)] z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[12px] font-medium text-page animate-fade-in">
            {toastMessage}
          </div>
        )}
      </div>
    </AppShell>
  );
}
