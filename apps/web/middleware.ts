// middleware.ts
import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(_req: NextRequestWithAuth) {
    // Optional: Add additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Only require auth for protected routes
        // Allow auth-related routes to pass through
        const isAuthRoute = 
          req.nextUrl.pathname.startsWith('/api/auth') ||
          req.nextUrl.pathname.startsWith('/login') ||
          req.nextUrl.pathname.startsWith('/signup');
        
        if (isAuthRoute) {
          return true; // Allow access to auth pages
        }
        
        // Require token for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    // Explicitly exclude auth routes from middleware
  ],
};
