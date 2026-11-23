/**
 * 1. Purpose: Provides the quiet completion screen after an under-18 account is removed.
 * 2. Spec Ref: Screen 8 Under-18 message.
 * 3. Called By: Setup age gate.
 * 4. Calls: next/link.
 */

import Link from 'next/link';

export default function Under18Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page p-4">
      <section className="w-full max-w-[428px] rounded-[20px] border border-hairline bg-card p-6 text-center shadow-none flex flex-col items-center">
        <h1 className="text-[20px] font-semibold leading-[26px] tracking-tight text-ink">
          Bunon is for adults
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted max-w-[320px]">
          We have not kept your account. You are welcome to return when you are 18 or older.
        </p>
        <Link
          href="/today"
          className="mt-6 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#1A1A1B] !text-[#FFFFFF] text-[#FFFFFF] dark:bg-[#EDEEEF] dark:!text-[#0E0F11] dark:text-[#0E0F11] px-5 text-[15px] font-medium transition-opacity hover:opacity-90 cursor-pointer"
        >
          Back to home
        </Link>
      </section>
    </main>
  );
}
