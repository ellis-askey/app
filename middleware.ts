// middleware.ts
// Redirects unauthenticated users to /login for all app routes.
// Public routes: /login and /api/auth/*

import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Protect everything except login, NextAuth endpoints, and static assets
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
