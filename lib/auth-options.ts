import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { login } from "@/services/auth";

const resolvedSecret =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV !== "production" ? "development-secret" : undefined);

export const authOptions: NextAuthOptions = {
  secret: resolvedSecret,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        try {
          const response = await login({
            email: credentials.email,
            password: credentials.password,
          });

          const accessToken = response.data.access_token;

          if (!accessToken) {
            return null;
          }

          return {
            id: credentials.email,
            email: credentials.email,
            accessToken,
          };
        } catch (error) {
          console.error("Error al autenticarse con el backend", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.accessToken) {
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
};
