import 'server-only';
/**
 * 1. Purpose: $0 deterministic greedy sub-step slicer for DAILY_ADAPTIVE plan style.
 * 2. Spec Ref: Prompt Catalog Rule 6 & Stitch Screen 22/today_inline_sub_steps_expanded.
 * 3. Called By: Today service and Today page view.
 * 4. Calls: Pure calculation logic.
 */

import type { SubStepItem, SlicedStep, StepSlicerResult } from '@/types/domain';

export type { SlicedStep, StepSlicerResult };

export function sliceAdaptiveSteps(
  steps: SubStepItem[],
  todayAvailableMinutes = 45
): StepSlicerResult {
  if (!steps || steps.length === 0) {
    return {
      steps: [],
      todaySliceCount: 0,
      isTodaySliceDone: false,
      restBannerMessage: null,
    };
  }

  let accumulatedMinutes = 0;
  let sliceCount = 0;
  const totalSteps = steps.length;

  // Find uncompleted steps and greedily assign up to todayAvailableMinutes
  const resultSteps: SlicedStep[] = [];
  let foundFirstUncompleted = false;

  for (let i = 0; i < totalSteps; i++) {
    const step = steps[i];
    const stepMin = step.minutes || 15;

    if (step.done) {
      resultSteps.push({
        ...step,
        is_today_slice: true,
      });
      sliceCount++;
      continue;
    }

    if (!foundFirstUncompleted) {
      foundFirstUncompleted = true;
      accumulatedMinutes += stepMin;
      resultSteps.push({
        ...step,
        is_today_slice: true,
      });
      sliceCount++;
      continue;
    }

    if (accumulatedMinutes + stepMin <= todayAvailableMinutes) {
      accumulatedMinutes += stepMin;
      resultSteps.push({
        ...step,
        is_today_slice: true,
      });
      sliceCount++;
    } else {
      resultSteps.push({
        ...step,
        is_today_slice: false,
      });
    }
  }

  // Check if all steps in today's slice are done
  const todaySliceSteps = resultSteps.filter((s) => s.is_today_slice);
  const uncompletedInSlice = todaySliceSteps.filter((s) => !s.done);
  const isTodaySliceDone = todaySliceSteps.length > 0 && uncompletedInSlice.length === 0;

  let restBannerMessage: string | null = null;
  if (isTodaySliceDone && resultSteps.some((s) => !s.done)) {
    const nextStep = resultSteps.find((s) => !s.done);
    restBannerMessage = nextStep
      ? `Today's steps done · Continue to Step ${nextStep.step_number} or rest until tomorrow`
      : `Today's steps done · Continue to next step or rest until tomorrow`;
  }

  return {
    steps: resultSteps,
    todaySliceCount: sliceCount,
    isTodaySliceDone,
    restBannerMessage,
  };
}
