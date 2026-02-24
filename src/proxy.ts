import { NextRequest, NextResponse } from 'next/server';

// Keep in sync with src/lib/server/auth.ts — inlined to avoid Node.js module imports in Edge Runtime
const SESSION_COOKIE = 'gyneva_session';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/api/auth/invite',
  '/_next',
  '/favicon.ico',
  '/icons',
  '/manifest.json',
  '/sw.js',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static assets
  if (
    pathname.includes('.') &&
    !pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE);
  if (!session?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
