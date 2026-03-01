import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth cookie (set on login by auth store)
  const authCookie = request.cookies.get('coolex-auth');

  // Parse auth state from cookie
  let isAuthenticated = false;
  let userRole = '';

  if (authCookie) {
    try {
      const authState = JSON.parse(authCookie.value);
      isAuthenticated = authState?.state?.isAuthenticated ?? false;
      userRole = authState?.state?.user?.role ?? '';
    } catch {
      isAuthenticated = false;
    }
  }

  // Auth state is in localStorage (Zustand persist), not accessible server-side.
  // Client-side layout guards handle auth redirects. Middleware only used for
  // additional server-side checks when cookies are available.
  if (authCookie) {
    // Redirect non-admins away from admin pages (cookie-based check)
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico).*)'],
};
