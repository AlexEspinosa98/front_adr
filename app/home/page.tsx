import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";

import { authOptions } from "@/lib/auth-options";

type AppSession = Session & { accessToken?: string };

export default async function HomePage() {
  const session = (await getServerSession(authOptions)) as AppSession | null;
  const accessToken = session?.accessToken;

  if (!accessToken) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-200 px-6 text-center">
      <div className="max-w-xl rounded-3xl bg-white p-10 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-400">
          Dashboard
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-neutral-900">
          Bienvenido, Administrador
        </h1>
        <p className="mt-4 text-sm text-neutral-500">
          Tu token activo se mantiene seguro durante toda la sesión, por lo que
          puedes seguir gestionando el panel sin volver a iniciar sesión mientras
          sea válido.
        </p>
      </div>
    </main>
  );
}
