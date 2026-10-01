import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge middleware uses the DB-free config. The `authorized` callback in
// authConfig redirects signed-out users away from /dashboard routes.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
  void req;
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
