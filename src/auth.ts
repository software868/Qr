import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        console.log("[AUTH] authorize called with email:", (raw as Record<string, unknown>)?.email);
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          console.log("[AUTH] validation failed:", parsed.error.flatten());
          return null;
        }
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) {
          console.log("[AUTH] user not found for email:", email.toLowerCase());
          return null;
        }
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          console.log("[AUTH] password mismatch for:", email);
          return null;
        }
        console.log("[AUTH] login success for:", email, "role:", user.role);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role as UserRole;
        console.log("[AUTH] jwt callback - setting token id:", user.id, "role:", user.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      console.log("[AUTH] session callback - role:", token.role, "id:", token.id);
      return session;
    },
  },
});
