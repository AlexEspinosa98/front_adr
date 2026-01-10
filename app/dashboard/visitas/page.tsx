import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { AdminVisitsView } from "./admin-visits-view";

type AppSession = Session & { accessToken?: string };

export default async function VisitsPage() {
  const session = (await getServerSession(authOptions)) as AppSession | null;

  if (!session?.accessToken) {
    redirect("/login");
  }

  return <AdminVisitsView initialView="visits" />;
}
