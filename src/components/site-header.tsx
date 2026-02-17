"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { UserProfile } from "@/components/auth/user-profile";
import { ModeToggle } from "./ui/mode-toggle";
import { Newspaper } from "lucide-react";
import { AVAILABLE_MENUS } from "@/lib/menu-items";

export function SiteHeader() {
  const { data: session } = useSession();
  const [allowedMenus, setAllowedMenus] = useState<string[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setLoaded(false);
      return;
    }

    fetch("/api/admin/users/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAllowedMenus(data.allowedMenus);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [session?.user]);

  const visibleMenus =
    !session?.user || !loaded
      ? []
      : allowedMenus === null
        ? AVAILABLE_MENUS
        : AVAILABLE_MENUS.filter((m) => allowedMenus.includes(m.slug));

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold">
            <Link
              href="/"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <Newspaper className="h-5 w-5" />
              </div>
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                OttoSeguridad
              </span>
            </Link>
          </h1>
          {session?.user && (
            <nav className="hidden md:flex items-center gap-6">
              {visibleMenus.map((menu) => (
                <Link
                  key={menu.slug}
                  href={menu.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {menu.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          <UserProfile />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
