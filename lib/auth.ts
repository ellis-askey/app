// lib/auth.ts
// Sprint 1 auth foundation.
//
// Dev bypass mode: when DEV_AUTH_BYPASS=true the app loads a seeded user
// without requiring credentials. Clear comments mark the replacement points
// for full auth (credentials, OAuth, magic link) in a future sprint.
//
// The User model is already NextAuth-compatible (accounts/sessions).

import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

// Shape exposed to the app via useSession() / getServerSession()
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      agencyId: string;
    };
  }
  interface User {
    role: UserRole;
    agencyId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    agencyId: string;
  }
}

export const authOptions: NextAuthOptions = {
  // In future sprints: swap to PrismaAdapter for persistent sessions
  // adapter: PrismaAdapter(prisma),

  session: { strategy: "jwt" },

  providers: [
    // ── Dev bypass ───────────────────────────────────────────────────────────
    // Accepts any email that exists in the database with no password check.
    // REPLACE this entire provider with proper credentials/OAuth in production.
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        // Future: add password field here when implementing real auth
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // In dev bypass mode, accept any seeded email with no password
        const devBypass = process.env.DEV_AUTH_BYPASS === "true";
        if (!devBypass) {
          // TODO Sprint 2+: implement password verification
          // e.g. bcrypt.compare(credentials.password, user.passwordHash)
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          agencyId: user.agencyId,
        };
      },
    }),
  ],

  callbacks: {
    // Persist extra fields into the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.agencyId = user.agencyId;
      }
      return token;
    },
    // Expose the JWT fields on session.user
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.agencyId = token.agencyId;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);
