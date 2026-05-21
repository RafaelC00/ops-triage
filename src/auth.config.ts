import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no database / Node APIs here).
 * Imported by both `middleware.ts` (Edge runtime) and `auth.ts` (Node runtime).
 * The `authorized` callback is the first line of route protection; every
 * mutation additionally re-checks the session server-side (defence in depth).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // Runs in middleware for matched routes. Returning false redirects to signIn.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) return isLoggedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: "USER" | "ADMIN" }).role ?? "USER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    },
  },
  providers: [], // real providers are attached in auth.ts (Node runtime)
} satisfies NextAuthConfig;
