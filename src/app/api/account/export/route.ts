/**
 * 1. Purpose: Generates and streams a clean, complete JSON export of all personal user data.
 * 2. Spec Ref: Screen 91 Export my data and Section 5.1 Privacy Policy clause 5.
 * 3. Called By: Settings Screen 91 Export my data button.
 * 4. Calls: Server Supabase client and PostgreSQL row queries.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/db/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select(
        'id, email, name, avatar_url, bio, city_country, work_study_role, birth_year, country, language, timezone, reminder_time, push_enabled, email_reminders_enabled, theme, streak_count, person_memory_json, created_at'
      )
      .eq('id', user.id)
      .maybeSingle();

    // 2. Fetch goals
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const goalIds = (goals ?? []).map((g) => g.id);

    // 3. Fetch milestones & tasks for user goals
    let milestones: unknown[] = [];
    let tasks: unknown[] = [];
    if (goalIds.length > 0) {
      const { data: milestoneRows } = await supabase
        .from('milestones')
        .select('*')
        .in('goal_id', goalIds)
        .order('index_in_goal', { ascending: true });
      milestones = milestoneRows ?? [];

      const { data: taskRows } = await supabase
        .from('tasks')
        .select('*')
        .in('goal_id', goalIds)
        .order('created_at', { ascending: true });
      tasks = taskRows ?? [];
    }

    // 4. Fetch day notes
    const { data: dayNotes } = await supabase
      .from('day_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('note_date', { ascending: true });

    // 5. Fetch evidence metadata (omitting raw private keys)
    const { data: evidence } = await supabase
      .from('evidence')
      .select(
        'id, task_id, goal_id, kind, caption, file_size_bytes, mime_type, created_at'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const exportPayload = {
      export_version: '2.5',
      exported_at: new Date().toISOString(),
      user: profile,
      goals: goals ?? [],
      milestones,
      tasks,
      day_notes: dayNotes ?? [],
      evidence: evidence ?? [],
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="bunon-data-export-${dateStr}.json"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Could not export account data' },
      { status: 500 }
    );
  }
}
