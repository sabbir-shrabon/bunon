/**
 * 1. Purpose: Refreshes Supabase sessions, limits public admin paths, and applies JIT auth redirects.
 * 2. Spec Ref: Milestone 2 Proxy and Frictionless Auth route protection requirements.
 * 3. Called By: Next.js request proxy pipeline.
 * 4. Calls: @supabase/ssr createServerClient and NextResponse.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeRedirect } from '@/lib/security';

const protectedPaths = ['/onboarding', '/settings', '/pro', '/upgrade', '/profile'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const isPublicHost = !host.startsWith('admin.');

  // Strict 404 for admin paths on the public user domain
  if (
    isPublicHost &&
    (pathname === '/admin' ||
      pathname.startsWith('/admin/') ||
      pathname === '/api/admin' ||
      pathname.startsWith('/api/admin/'))
  ) {
    const res = new NextResponse(null, { status: 404 });
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return res;
  }

  const requestHeaders = new Headers(request.headers);
  const platformHeader = request.headers.get('x-bunon-platform');
  requestHeaders.set(
    'x-bunon-platform',
    platformHeader === 'play-store' ? 'play-store' : 'web'
  );

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Apply standard security headers on all proxy responses
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Check if incoming request has any Supabase auth cookie (sb-*)
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((cookie) => cookie.name.startsWith('sb-'));

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // If NO sb- auth cookie is present:
  if (!hasAuthCookie) {
    // For protected routes, immediately redirect to /login?next=<encoded_path> without waiting for Supabase
    if (isProtected) {
      const targetPath = sanitizeRedirect(
        `${pathname}${request.nextUrl.search}`,
        '/today'
      );
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = `?next=${encodeURIComponent(targetPath)}`;
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.headers.set('X-Frame-Options', 'DENY');
      redirectResponse.headers.set('X-Content-Type-Options', 'nosniff');
      redirectResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      return redirectResponse;
    }

    // For public / guest routes, return immediately (0ms, zero Supabase round-trip!)
    return response;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Enforce Just-in-Time Auth redirects with strict anti-phishing sanitization
  if (!user && isProtected) {
    const targetPath = sanitizeRedirect(
      `${pathname}${request.nextUrl.search}`,
      '/today'
    );
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = `?next=${encodeURIComponent(targetPath)}`;
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.headers.set('X-Frame-Options', 'DENY');
    redirectResponse.headers.set('X-Content-Type-Options', 'nosniff');
    redirectResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
