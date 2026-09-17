import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

const PROTECTED_ROUTES = ['/dashboard', '/reports', '/settings', '/staff', '/inventory', '/pos', '/orders', '/products', '/sales', '/users', '/day-closing', '/api'];

export async function proxy(request: NextRequest) {
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
      // Optional: Check role here if some routes are admin only
      if (['/settings', '/reports', '/staff', '/inventory', '/users', '/day-closing', '/api/reports'].some(r => path.startsWith(r))) {
        if (payload.role !== 'ADMIN') {
          if (path.startsWith('/api/')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    } catch (err) {
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
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
