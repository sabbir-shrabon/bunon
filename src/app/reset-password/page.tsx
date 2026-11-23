/**
 * 1. Purpose: Displays the password replacement screen after a valid Supabase recovery link.
 * 2. Spec Ref: Screen 6 Password Reset completion.
 * 3. Called By: Next.js App Router for '/reset-password'.
 * 4. Calls: PasswordResetCard.
 */

import { PasswordResetCard } from '@/components/auth/password-reset-card';

export default function ResetPasswordPage() {
  return <PasswordResetCard reset />;
}
