/**
 * 1. Purpose: Client helper orchestrating the two-step week review and next-week planning calls.
 * 2. Spec Ref: UI Design Guide Category C State 23 & two-step timeout-resilient week rollover.
 * 3. Called By: TodayView.
 * 4. Calls: POST /api/weeks/review and POST /api/weeks/plan-next.
 */

export interface PlanNextWeekClientResult {
  weeklyReviewId: string;
  isGoalCompleted: boolean;
  journeyCardSlug?: string;
  nextWeekNumber?: number;
}

const CALM_RETRY_MESSAGE =
  "We could not build next week's plan just now. Your progress is safe — please tap to try again.";

function toCalmUserMessage(raw?: string): string {
  if (!raw) return CALM_RETRY_MESSAGE;
  const trimmed = raw.trim();
  if (
    trimmed.startsWith('{') ||
    trimmed.startsWith('[') ||
    trimmed.includes('INVALID_ARGUMENT') ||
    trimmed.includes('"error"')
  ) {
    return CALM_RETRY_MESSAGE;
  }
  return trimmed;
}

export async function runTwoStepWeekAdvance(
  goalId: string,
  currentWeek: number,
  onStepChange: (label: string) => void
): Promise<PlanNextWeekClientResult> {
  onStepChange(`Step 1 of 2: Reviewing Week ${currentWeek}...`);
  const reviewRes = await fetch('/api/weeks/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalId }),
  });

  if (!reviewRes.ok) {
    const err = (await reviewRes.json().catch(() => ({}))) as { message?: string };
    throw new Error(toCalmUserMessage(err.message));
  }

  onStepChange(`Step 2 of 2: Building Week ${currentWeek + 1}...`);
  const planRes = await fetch('/api/weeks/plan-next', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalId }),
  });

  if (!planRes.ok) {
    const err = (await planRes.json().catch(() => ({}))) as { message?: string };
    throw new Error(toCalmUserMessage(err.message));
  }

  return (await planRes.json()) as PlanNextWeekClientResult;
}

export async function requestTaskScheduleAdjust(taskId: string, stuckReason: string): Promise<void> {
  const res = await fetch(`/api/tasks/${taskId}/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stuckReason }),
  });
  if (res.ok) return;
  const err = (await res.json().catch(() => ({}))) as { message?: string };
  throw new Error(
    err.message ||
      'Bunon AI is briefly paused. Your Today tasks, proofs, and Timeline continue working normally.'
  );
}
