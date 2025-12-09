import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";

import { AdminExplorerView } from "./admin-explorer-view";
import { authOptions } from "@/lib/auth-options";

type AppSession = Session & { accessToken?: string };

export default async function DashboardPage() {
  const session = (await getServerSession(authOptions)) as AppSession | null;

  if (!session?.accessToken) {
    redirect("/login");
  }

  return <AdminExplorerView />;
}
