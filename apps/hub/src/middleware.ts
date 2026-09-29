import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('qor_token');
  
  // Redirect /portal to /dashboard (legacy route support)
  if (pathname === '/portal' || pathname.startsWith('/portal/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Admin route protection - redirect to home if not authenticated
  if (pathname.startsWith('/admin') && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Redirect authenticated users away from login/register to dashboard
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Allow unauthenticated users to access login/register (AuthGate handles display)
  // Don't redirect them - just let the page load
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*', '/login', '/register']
}
