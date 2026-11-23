/**
 * 1. Purpose: Database row, insert, and update types for user and account tables.
 * 2. Spec Ref: Database Schema v2.5 Section 5 (Tables 1, 2, 10, 11, 13).
 * 3. Called By: src/types/database.ts, client and server database services.
 * 4. Calls: src/types/domain.ts.
 */

import type {
  UserRole,
  UserStatus,
  CoachingTone,
  SupportedLanguage,
  AppTheme,
  PersonMemoryData,
  DayTimeMap,
  NotificationType,
} from '../domain';

export interface UserRow {
  id: string;
  email: string;
  auth_provider: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  city_country: string | null;
  work_study_role: string | null;
  birth_year: number | null;
  country: string;
  language: SupportedLanguage;
  role: UserRole;
  status: UserStatus;
  timezone: string;
  reminder_time: string;
  last_reminder_nudge_at: string | null;
  preferred_coaching_tone: CoachingTone;
  push_enabled: boolean;
  email_reminders_enabled: boolean;
  theme: AppTheme;
  streak_count: number;
  streak_visible: boolean;
  last_working_task_date: string | null;
  person_memory_json: PersonMemoryData;
  person_memory_version: number;
  day_time_map_json: DayTimeMap;
  pro_until: string | null;
  pro_source: string | null;
  storage_used_bytes: number;
  daily_photo_date: string | null;
  daily_photo_count: number;
  created_at: string;
  updated_at: string;
}

export type UserInsert = Omit<Partial<UserRow>, 'id' | 'email'> & {
  id: string;
  email: string;
  name: string;
};

export type UserUpdate = Partial<Omit<UserRow, 'id' | 'created_at'>>;

export interface AdminUsers2faRow {
  admin_user_id: string;
  totp_secret_encrypted: string | null;
  totp_enabled: boolean;
  session_version: number;
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
}

export type AdminUsers2faInsert = Omit<
  Partial<AdminUsers2faRow>,
  'admin_user_id'
> & {
  admin_user_id: string;
};

export type AdminUsers2faUpdate = Partial<
  Omit<AdminUsers2faRow, 'admin_user_id'>
>;

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  target_screen: string;
  is_read: boolean;
  created_at: string;
}

export type NotificationInsert = Omit<
  Partial<NotificationRow>,
  'id' | 'created_at' | 'user_id' | 'type' | 'title' | 'body' | 'target_screen'
> & {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  target_screen: string;
};

export type NotificationUpdate = Partial<
  Omit<NotificationRow, 'id' | 'user_id' | 'created_at'>
>;

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent: string | null;
  created_at: string;
}

export type PushSubscriptionInsert = Omit<
  Partial<PushSubscriptionRow>,
  'id' | 'created_at' | 'user_id' | 'endpoint' | 'p256dh_key' | 'auth_key'
> & {
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
};

export type PushSubscriptionUpdate = Partial<
  Omit<PushSubscriptionRow, 'id' | 'user_id' | 'created_at'>
>;

export interface ReferralRow {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referral_code: string;
  referred_tasks_completed: number;
  reward_days_granted: number;
  reward_status: 'PENDING' | 'GRANTED';
  granted_at: string | null;
}

export type ReferralInsert = Omit<
  Partial<ReferralRow>,
  'id' | 'referrer_user_id' | 'referred_user_id' | 'referral_code'
> & {
  referrer_user_id: string;
  referred_user_id: string;
  referral_code: string;
};

export type ReferralUpdate = Partial<
  Omit<ReferralRow, 'id' | 'referrer_user_id' | 'referred_user_id'>
>;
