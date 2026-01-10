import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { AdminReportsView } from "./admin-report-view";

type AppSession = Session & { accessToken?: string };

export default async function ExtensionistReportPage() {
  const session = (await getServerSession(authOptions)) as AppSession | null;

  if (!session?.accessToken) {
    redirect("/login");
  }

  return <AdminReportsView initialView="reports" />;
}
