import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getActiveSubscriberCount } from "@/lib/db/queries/subscribers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const subscriberCount = await getActiveSubscriberCount().catch(() => 0);

  return (
    <div
      className="grid min-h-screen"
      style={{
        gridTemplateColumns: "240px 1fr",
        background: "var(--otto-bg)",
        color: "var(--otto-ink)",
      }}
    >
      <Sidebar subscriberCount={subscriberCount} />
      <main className="w-full min-w-0 max-w-[1280px] px-8 pb-16 pt-6">
        {children}
      </main>
    </div>
  );
}
