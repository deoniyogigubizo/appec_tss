import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { UserRole } from '@/models/User';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const userRole = token.role as UserRole;

    // Define role-based access paths
    const rolePaths: Record<UserRole, string[]> = {
      admin: ['/dashboard/admin'],
      secretary: ['/dashboard/secretary'],
      dos: ['/dashboard/dos'],
      dod: ['/dashboard/dod'],
      teacher: ['/dashboard/teacher'],
      student: ['/dashboard/student'],
      hod: ['/dashboard/hod'],
    };

    // Check if the user is accessing their allowed path
    const allowedPaths = rolePaths[userRole] || [];
    const hasAccess = allowedPaths.some((p) => req.nextUrl.pathname.startsWith(p));

    // Allow access to root dashboard which redirects based on role
    if (req.nextUrl.pathname === '/dashboard') {
      return NextResponse.next();
    }

    // Redirect to appropriate dashboard if accessing wrong role's path
    if (!hasAccess) {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*'],
};
