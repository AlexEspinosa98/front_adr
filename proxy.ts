import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => Boolean(token?.accessToken),
  },
});

export const config = {
  // Protege todo excepto rutas públicas y recursos estáticos
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|auth|.*\\..*).*)",
  ],
};
