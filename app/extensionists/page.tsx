import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";

import { ExtensionistsView } from "./extensionists-view";
import { authOptions } from "@/lib/auth-options";

type AppSession = Session & { accessToken?: string };

export default async function ExtensionistsPage() {
  const session = (await getServerSession(authOptions)) as AppSession | null;

  if (!session?.accessToken) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen bg-emerald-50 px-4 py-10">
      <div className="mx-auto flex w-full justify-center">
        <ExtensionistsView />
      </div>
    </main>
  );
}
