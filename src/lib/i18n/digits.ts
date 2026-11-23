/**
 * 1. Purpose: Converts displayed Latin numerals into Bangla numerals when requested.
 * 2. Spec Ref: Milestone 2 Design System and Language preference requirements.
 * 3. Called By: Localized interface components.
 * 4. Calls: None.
 */

export type AppLanguage = 'EN' | 'BN';

const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toLocaleDigits(value: number | string, language: AppLanguage): string {
  const text = String(value);
  return language === 'BN' ? text.replace(/\d/g, (digit) => banglaDigits[Number(digit)]) : text;
}
