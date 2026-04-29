"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inDashboard = pathname?.startsWith("/dashboard") ?? false;

  if (inDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
