import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ManualContent } from "./manual-content";

export const dynamic = "force-dynamic";

export default async function ManualPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return <ManualContent />;
}
