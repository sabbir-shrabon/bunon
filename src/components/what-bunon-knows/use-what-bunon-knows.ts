/**
 * 1. Purpose: Custom hook managing memory items, day time map, and mutations for Page 50a.
 * 2. Spec Ref: Page 50a in UI Design Guide & context-service.ts.
 * 3. Called By: WhatBunonKnowsView.
 * 4. Calls: /api/what-bunon-knows.
 */

'use client';

import { useState } from 'react';
import type { WhatBunonKnowsResponse } from '@/lib/services/context-service';
import type { MemoryItem, DayTimeMap } from '@/types/domain';

export function useWhatBunonKnows(initialData: WhatBunonKnowsResponse) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<string>(
    initialData.selectedGoalId || 'about-me'
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [prefillBooster, setPrefillBooster] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleUpdateDayTimeMap = async (updated: DayTimeMap) => {
    setData((prev) => ({ ...prev, dayTimeMap: updated }));
    await fetch('/api/what-bunon-knows', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayTimeMap: updated }),
    });
    showToast('Updated focus schedule');
  };

  const handleAddFact = async (fact: string, saveToAboutMe: boolean) => {
    setSheetOpen(false);
    const targetScope = saveToAboutMe || activeTab === 'about-me' ? 'PERSON' : 'GOAL';
    const targetGoalId = targetScope === 'GOAL' ? activeTab : null;

    const res = await fetch('/api/what-bunon-knows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: targetScope,
        fact,
        goalId: targetGoalId,
      }),
    });

    if (res.ok) {
      const { item } = (await res.json()) as { item: MemoryItem };
      if (targetScope === 'PERSON') {
        setData((prev) => ({
          ...prev,
          aboutMe: { ...prev.aboutMe, items: [item, ...prev.aboutMe.items] },
        }));
      } else {
        setData((prev) => ({
          ...prev,
          goals: prev.goals.map((g) =>
            g.id === targetGoalId
              ? {
                  ...g,
                  journeyMemory: {
                    ...g.journeyMemory,
                    items: [item, ...g.journeyMemory.items],
                  },
                }
              : g
          ),
        }));
      }
      showToast('Saved to What Bunon knows');
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<MemoryItem>) => {
    const isGoal = activeTab !== 'about-me';
    const goalId = isGoal ? activeTab : null;

    await fetch('/api/what-bunon-knows', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: id, updates, goalId }),
    });

    if (!isGoal) {
      setData((prev) => ({
        ...prev,
        aboutMe: {
          ...prev.aboutMe,
          items: prev.aboutMe.items.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        },
      }));
    } else {
      setData((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                journeyMemory: {
                  ...g.journeyMemory,
                  items: g.journeyMemory.items.map((i) =>
                    i.id === id ? { ...i, ...updates } : i
                  ),
                },
              }
            : g
        ),
      }));
    }
    showToast(
      updates.pinned !== undefined
        ? updates.pinned
          ? 'Pinned rule'
          : 'Unpinned rule'
        : 'Updated rule'
    );
  };

  const handleDeleteItem = async (id: string) => {
    const isGoal = activeTab !== 'about-me';
    const goalId = isGoal ? activeTab : null;

    await fetch(
      `/api/what-bunon-knows?itemId=${id}${goalId ? `&goalId=${goalId}` : ''}`,
      { method: 'DELETE' }
    );

    if (!isGoal) {
      setData((prev) => ({
        ...prev,
        aboutMe: {
          ...prev.aboutMe,
          items: prev.aboutMe.items.filter((i) => i.id !== id),
        },
      }));
    } else {
      setData((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                journeyMemory: {
                  ...g.journeyMemory,
                  items: g.journeyMemory.items.filter((i) => i.id !== id),
                },
              }
            : g
        ),
      }));
    }
    showToast('Removed rule');
  };

  return {
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
  };
}
