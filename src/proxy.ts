import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/jwt';

const PROTECTED_ROUTES = ['/dashboard', '/reports', '/settings', '/staff', '/inventory', '/pos', '/orders', '/products', '/sales', '/users', '/day-closing', '/api'];
const ADMIN_ONLY_ROUTES = ['/settings', '/reports', '/staff', '/inventory', '/users', '/day-closing', '/api/reports'];

export async function proxy(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;

    const isProtected = PROTECTED_ROUTES.some(route => path.startsWith(route));

    if (isProtected) {
      const cookie = request.cookies.get('auth-token')?.value;

      if (!cookie) {
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      try {
        const payload = await decrypt(cookie);

        if (ADMIN_ONLY_ROUTES.some(r => path.startsWith(r))) {
          if (payload.role !== 'ADMIN') {
            if (path.startsWith('/api/')) {
              return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        }
      } catch (err) {
        // Invalid/expired token — treat as unauthenticated
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }

    // Redirect /admin (which is just a directory) to /admin/login
    if (path === '/admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  } catch (err) {
    // Catch-all: never let proxy crash the page load
    console.error('[proxy] Unexpected error:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
