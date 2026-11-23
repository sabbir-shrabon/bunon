/**
 * 1. Purpose: Displays the password reset email request screen.
 * 2. Spec Ref: Screen 5 Password Reset.
 * 3. Called By: Next.js App Router for '/forgot-password'.
 * 4. Calls: PasswordResetCard.
 */

import { PasswordResetCard } from '@/components/auth/password-reset-card';

export default function ForgotPasswordPage() {
  return <PasswordResetCard />;
}
