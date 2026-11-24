/**
 * 1. Purpose: Orchestrates the multi-step Onboarding wizard view (Screens 10a–21).
 * 2. Spec Ref: Category B in UI Design Guide & Master Build Plan v2.5.
 * 3. Called By: /onboarding/page.tsx.
 * 4. Calls: Screen components, useOnboardingWizard hook.
 */

'use client';

import React from 'react';
import { Screen10aChoosePath } from '@/components/onboarding/screen-10a-choose-path';
import { Screen10bFileContext } from '@/components/onboarding/screen-10b-file-context';
import { Screen10GoalWhy } from '@/components/onboarding/screen-10-goal-why';
import { Screen11Deadline } from '@/components/onboarding/screen-11-deadline';
import { Screen12WorkingDays } from '@/components/onboarding/screen-12-working-days';
import { Screen13WrittenQuestions } from '@/components/onboarding/screen-13-written-questions';
import { Screen14Loading } from '@/components/onboarding/screen-14-loading';
import { Screen15ConfirmCategory } from '@/components/onboarding/screen-15-confirm-category';
import { Screen16Safety } from '@/components/onboarding/screen-16-safety';
import { Screen17RoadmapPreview } from '@/components/onboarding/screen-17-roadmap-preview';
import { Screen20WeeklyStyle } from '@/components/onboarding/screen-20-weekly-style';
import { Screen21ErrorState } from '@/components/onboarding/screen-21-error-state';
import { useOnboardingWizard } from '@/components/onboarding/use-onboarding-wizard';

export function OnboardingWizard() {
  const {
    state,
    setState,
    aiFollowupIndex,
    setAiFollowupIndex,
    handleSelectPath,
    handleFileContext,
    handleQ1,
    handleQ2,
    handleQ3,
    handleQ4,
    handleQ5,
    executeContextIngest,
    handleConfirmCategory,
    handleAiFollowupAnswer,
    buildRoadmap,
    handleLockAndPlan,
    setConfirmedMemoryFacts,
  } = useOnboardingWizard();

  if (state.step === 'CHOOSE_PATH_10A') {
    return <Screen10aChoosePath onSelectPath={handleSelectPath} />;
  }

  if (state.step === 'FILE_CONTEXT_10B') {
    return (
      <Screen10bFileContext
        initialFile={state.attachedFile}
        initialText={state.pastedNotes}
        initialOutlineMode={state.outlineMode}
        onBack={() => setState((s) => ({ ...s, step: 'CHOOSE_PATH_10A' }))}
        onContinue={handleFileContext}
      />
    );
  }

  if (state.step === 'Q1_GOAL_WHY') {
    return (
      <Screen10GoalWhy
        initialGoal={state.goalTitle}
        initialWhy={state.goalWhy}
        onBack={() => setState((s) => ({ ...s, step: 'CHOOSE_PATH_10A' }))}
        onContinue={handleQ1}
      />
    );
  }

  if (state.step === 'Q2_DEADLINE') {
    return (
      <Screen11Deadline
        initialDeadline={state.deadlineDate}
        onBack={() => setState((s) => ({ ...s, step: s.entryPath === 'FILE_NOTES' ? 'FILE_CONTEXT_10B' : 'Q1_GOAL_WHY' }))}
        onContinue={handleQ2}
      />
    );
  }

  if (state.step === 'Q3_WORKING_DAYS') {
    return (
      <Screen12WorkingDays
        initialDays={state.workingDays}
        initialHours={state.hoursPerDay}
        onBack={() => setState((s) => ({ ...s, step: 'Q2_DEADLINE' }))}
        onContinue={handleQ3}
      />
    );
  }

  if (state.step === 'Q4_BASELINE') {
    return (
      <Screen13WrittenQuestions
        questionNumber={4}
        totalSteps={8}
        title="Where are you now? What have you already done?"
        whyWeAsk="Used as your Day-1 baseline for progress tracking and your then vs. now comparison."
        placeholder="e.g. Completed tutorials, know the basics, have not built a full project..."
        starterChips={['Starting from zero', 'Know the basics, built nothing yet', 'Experienced, need consistency']}
        initialValue={state.currentBaseline}
        onBack={() => setState((s) => ({ ...s, step: 'Q3_WORKING_DAYS' }))}
        onNext={handleQ4}
      />
    );
  }

  if (state.step === 'Q5_CONSTRAINTS') {
    return (
      <Screen13WrittenQuestions
        questionNumber={5}
        totalSteps={8}
        title="What constraints do you have — money, tools, skills?"
        whyWeAsk="Helps Bunon suggest steps that fit your actual budget, software, and hardware."
        placeholder="e.g. Free tools only, 1 hour available per evening, self-taught..."
        starterChips={['Free tools only', 'Limited budget', 'Self-taught with docs']}
        initialValue={state.constraints}
        isSkippable
        onBack={() => setState((s) => ({ ...s, step: 'Q4_BASELINE' }))}
        onNext={handleQ5}
        onSkip={() => handleQ5('')}
      />
    );
  }

  if (state.step === 'LOADING_FOLLOWUPS') {
    return <Screen14Loading goalTitle={state.goalTitle} stage={state.entryPath === 'FILE_NOTES' ? 'context_ingest' : 'followups'} />;
  }

  if (state.step === 'SAFETY') {
    return (
      <Screen16Safety
        safetyStatus={state.pipeline1Output?.safety_status === 'DISTURBING_HELP' ? 'DISTURBING_HELP' : 'REFUSE_UNSAFE'}
        refusalReason={state.pipeline1Output?.safety_message}
        onEditGoal={() => setState((s) => ({ ...s, step: s.entryPath === 'FILE_NOTES' ? 'FILE_CONTEXT_10B' : 'Q1_GOAL_WHY' }))}
      />
    );
  }

  if (state.step === 'CONFIRM_CATEGORY') {
    return (
      <Screen15ConfirmCategory
        detectedCategory={state.confirmedCategory}
        onBack={() => setState((s) => ({ ...s, step: s.entryPath === 'FILE_NOTES' ? 'Q3_WORKING_DAYS' : 'Q5_CONSTRAINTS' }))}
        onConfirm={handleConfirmCategory}
      />
    );
  }

  if (state.step === 'AI_FOLLOWUPS') {
    const currentQ = state.pipeline1Output?.followup_questions[aiFollowupIndex];
    return (
      <Screen13WrittenQuestions
        questionNumber={6 + aiFollowupIndex}
        totalSteps={6 + (state.pipeline1Output?.followup_questions.length || 2)}
        title={currentQ?.question || 'Tell us a bit more'}
        whyWeAsk={currentQ?.why_we_ask || 'Helps tailor your specific weekly actions.'}
        placeholder="Type your response..."
        starterChips={currentQ?.quick_chips || []}
        initialValue={state.followupAnswers[aiFollowupIndex] || ''}
        isSkippable
        onBack={() => {
          if (aiFollowupIndex > 0) setAiFollowupIndex(aiFollowupIndex - 1);
          else setState((s) => ({ ...s, step: 'CONFIRM_CATEGORY' }));
        }}
        onNext={handleAiFollowupAnswer}
        onSkip={() => handleAiFollowupAnswer('')}
      />
    );
  }

  if (state.step === 'LOADING_ROADMAP') {
    return <Screen14Loading goalTitle={state.goalTitle} stage="roadmap" />;
  }

  if (state.step === 'ROADMAP_PREVIEW' && state.pipeline2Output) {
    const activeRoadmap =
      state.activePlanVersion === 'B' && state.previousRoadmap
        ? state.pipeline2Output
        : state.previousRoadmap || state.pipeline2Output;

    return (
      <Screen17RoadmapPreview
        goalTitle={state.goalTitle}
        deadlineDate={state.deadlineDate}
        totalWeeks={state.totalWeeks}
        availableHours={state.availableHoursTotal}
        currentRoadmap={activeRoadmap}
        previousRoadmap={state.previousRoadmap}
        activePlan={state.activePlanVersion}
        confirmedMemoryFacts={state.confirmedMemoryFacts}
        onChangeConfirmedMemoryFacts={setConfirmedMemoryFacts}
        onSwitchPlan={(plan) => setState((s) => ({ ...s, activePlanVersion: plan }))}
        onRegenerate={async (reason, notes) =>
          buildRoadmap(state.confirmedCategory, state.followupAnswers, true, reason, notes)
        }
        onLockRoadmap={() => setState((s) => ({ ...s, step: 'CHOOSE_WEEKLY_STYLE' }))}
        onBack={() => {
          const hasFollowups = (state.pipeline1Output?.followup_questions?.length ?? 0) > 0;
          setState((s) => ({ ...s, step: hasFollowups ? 'AI_FOLLOWUPS' : 'CONFIRM_CATEGORY' }));
        }}
      />
    );
  }

  if (state.step === 'CHOOSE_WEEKLY_STYLE') {
    return (
      <Screen20WeeklyStyle
        category={state.confirmedCategory}
        recommendedStyle={state.planStyle}
        onBack={() => setState((s) => ({ ...s, step: 'ROADMAP_PREVIEW' }))}
        onSubmit={handleLockAndPlan}
      />
    );
  }

  return (
    <Screen21ErrorState
      errorMessage={state.errorMessage}
      onRetry={() => {
        if (state.entryPath === 'FILE_NOTES' && !state.pipeline1BOutput) {
          void executeContextIngest(state, state.workingDays, state.hoursPerDay);
        } else if (!state.pipeline1Output) {
          void handleQ5(state.constraints);
        } else {
          void buildRoadmap(state.confirmedCategory, state.followupAnswers);
        }
      }}
    />
  );
}
