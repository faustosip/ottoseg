import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getActiveSubscriberCount } from "@/lib/db/queries/subscribers";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";

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

  const [subscriberCount, userRow] = await Promise.all([
    getActiveSubscriberCount().catch(() => 0),
    db
      .select({ allowedMenus: user.allowedMenus })
      .from(user)
      .where(eq(user.id, session.user.id))
      .then((rows) => rows[0] ?? null)
      .catch(() => null),
  ]);

  // null = sin restricción (legacy/admin) — ve todo.
  // array = lista explícita de slugs permitidos.
  const allowedMenus = userRow?.allowedMenus ?? null;

  return (
    <div
      className="grid min-h-screen"
      style={{
        gridTemplateColumns: "240px 1fr",
        background: "var(--otto-bg)",
        color: "var(--otto-ink)",
      }}
    >
      <Sidebar
        subscriberCount={subscriberCount}
        allowedMenus={allowedMenus}
      />
      <main className="w-full min-w-0 max-w-[1280px] px-8 pb-16 pt-6">
        {children}
      </main>
    </div>
  );
}
