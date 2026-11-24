'use client';
/**
 * 1. Purpose: Client view for Screen 50 Roadmap Journey Map with continuous Thread and discrete nodes.
 * 2. Spec Ref: Stitch roadmap_journey_map Screen 50 and UI Design Guide Category E.
 * 3. Called By: /roadmap page.
 * 4. Calls: AppShell, RoadmapNodes, GoalMenuSheet, and MilestoneDetailModal.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import {
  StartAnchor,
  CompletedMilestoneNode,
  ActiveMilestoneCard,
  UpcomingMilestoneNode,
  FinishDestinationAnchor,
} from './roadmap-nodes';
import { MilestoneDetailModal, type MilestoneProofItem } from './milestone-detail-modal';
import { GoalMenuSheet } from './goal-menu-sheet';
import { PauseGoalSheet, ExtendDeadlineSheet } from './pause-extend-sheets';
import { RescueSheet } from './rescue-sheet';
import { GoalSwitcherSheet } from '@/components/today/goal-switcher-sheet';
import type { PlanStyle } from '@/types/domain';

interface MilestoneData {
  id: string;
  position: number;
  title: string;
  expected_result: string;
  estimated_hours: number;
  competency_status?: string;
  status: string;
  proof_count: number;
  proofs?: MilestoneProofItem[];
}

interface RoadmapViewProps {
  goal: {
    id: string;
    title: string;
    deadline: string;
    created_at: string;
    plan_style: PlanStyle;
    status: string;
  } | null;
  milestones: MilestoneData[];
  allGoals: Array<{ id: string; title: string; status: string }>;
  isPro?: boolean;
}

export function RoadmapView({ goal, milestones, allGoals, isPro }: Readonly<RoadmapViewProps>) {
  const [activePlanStyle, setActivePlanStyle] = useState<PlanStyle>(
    goal?.plan_style || 'FLEXIBLE_WEEK'
  );
  const [deadline, setDeadline] = useState(goal?.deadline || '');
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneData | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [isRescueOpen, setIsRescueOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  if (!goal) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <h1 className="text-[20px] font-bold text-ink">No active goal found</h1>
          <p className="text-[14px] text-muted mt-2 max-w-[320px]">
            Start your first goal on Today to see your personalized journey path here.
          </p>
          <Link
            href="/today"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1A1A1B] text-white px-5 text-[14px] font-medium"
          >
            Go to Today
          </Link>
        </div>
      </AppShell>
    );
  }

  const completedMilestones = milestones.filter((m) => m.status === 'DONE');
  const activeMilestone = milestones.find((m) => m.status === 'ACTIVE') || milestones[0];
  const upcomingMilestones = milestones.filter(
    (m) => m.status === 'UPCOMING' && m.position > (activeMilestone?.position || 1)
  );

  const targetDateFormatted = new Date(deadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <AppShell>
      <div className="flex flex-col w-full max-w-[640px] mx-auto px-5 pt-4 pb-12">
        {/* Header Row: Whisper-quiet goal selector and target meta */}
        <div className="flex justify-between items-center mb-3 text-[13px] leading-tight text-muted">
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(true)}
            className="flex items-center gap-1 font-medium text-ink hover:text-muted transition-colors cursor-pointer"
          >
            <span>{goal.title}</span>
            <span className="text-[16px]">▾</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted">Target: {targetDateFormatted}</span>
            <button
              type="button"
              aria-label="Goal options"
              onClick={() => setIsMenuOpen(true)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary-surface transition-colors text-muted cursor-pointer"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Title Row */}
        <div className="flex justify-between items-baseline mb-6">
          <h1 className="text-[22px] leading-none font-bold tracking-tight text-ink">
            Your path
          </h1>
          <Link
            href={`/what-bunon-knows?goalId=${goal.id}`}
            className="text-[13px] font-normal text-muted hover:text-ink transition-colors"
          >
            What Bunon knows ›
          </Link>
        </div>

        {/* The Continuous Vertical Thread Journey */}
        <div className="relative w-full">
          {/* Continuous Hairline Spine (Thread) */}
          <div className="absolute left-[11px] top-2 bottom-3 w-[1.5px] bg-hairline -translate-x-1/2" />

          {/* Node 1: Start Anchor */}
          <StartAnchor
            startDate={goal.created_at}
            onOpenBaseline={() => setSelectedMilestone(milestones[0])}
          />

          {/* Node 2: Completed Milestones */}
          {completedMilestones.map((m) => (
            <CompletedMilestoneNode
              key={m.id}
              title={m.title}
              proofCount={m.proof_count}
              onSelect={() => setSelectedMilestone(m)}
            />
          ))}

          {/* Node 3: Active Milestone (The ONLY white card on the screen) */}
          {activeMilestone && (
            <ActiveMilestoneCard
              milestoneNumber={activeMilestone.position}
              totalMilestones={milestones.length}
              title={activeMilestone.title}
              expectedResult={activeMilestone.expected_result}
              proofCount={activeMilestone.proof_count}
              estimatedHours={Number(activeMilestone.estimated_hours)}
              onViewProofs={() => setSelectedMilestone(activeMilestone)}
            />
          )}

          {/* Node 4: Upcoming Milestones */}
          {upcomingMilestones.map((m) => (
            <UpcomingMilestoneNode
              key={m.id}
              title={m.title}
              onSelect={() => setSelectedMilestone(m)}
            />
          ))}

          {/* Node 5: Finish Destination Anchor */}
          <FinishDestinationAnchor
            milestonesLeft={upcomingMilestones.length + (activeMilestone ? 1 : 0)}
            isEarned={goal.status === 'COMPLETED'}
          />
        </div>
      </div>

      {/* Sheets & Modals */}
      <MilestoneDetailModal
        milestone={selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
      />

      <GoalMenuSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        goalId={goal.id}
        currentPlanStyle={activePlanStyle}
        onOpenPause={() => setIsPauseOpen(true)}
        onOpenExtend={() => setIsExtendOpen(true)}
        onOpenRescue={() => setIsRescueOpen(true)}
        onStyleChanged={(newStyle) => setActivePlanStyle(newStyle)}
      />

      <PauseGoalSheet
        isOpen={isPauseOpen}
        onClose={() => setIsPauseOpen(false)}
        goalId={goal.id}
        currentDeadline={deadline}
        onSuccess={(newDeadline) => setDeadline(newDeadline)}
      />

      <ExtendDeadlineSheet
        isOpen={isExtendOpen}
        onClose={() => setIsExtendOpen(false)}
        goalId={goal.id}
        currentDeadline={deadline}
        onSuccess={(newDeadline) => setDeadline(newDeadline)}
      />

      <RescueSheet
        isOpen={isRescueOpen}
        onClose={() => setIsRescueOpen(false)}
        goalId={goal.id}
      />

      <GoalSwitcherSheet
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        goals={allGoals.map((g) => ({
          id: g.id,
          title: g.title,
          category: 'OTHER',
          pendingCount: 0,
        }))}
        activeGoalId={goal.id}
        isPro={isPro}
        onSelectGoal={(selectedId) => {
          setIsSwitcherOpen(false);
          window.location.href = `/roadmap?goalId=${selectedId}`;
        }}
      />
    </AppShell>
  );
}
