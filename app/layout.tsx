import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "ADR Admin",
  description:
    "Portal administrativo para validar credenciales y acceder al panel principal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="pt-16">
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
