"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { ModeToggle } from "./ui/mode-toggle";
import { LogIn, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AVAILABLE_MENUS } from "@/lib/menu-items";

function initialsFromName(name?: string | null, email?: string | null) {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "";
  if (!source) return "OS";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function SiteHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
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

  const initials = initialsFromName(session?.user?.name, session?.user?.email);

  async function handleSignOut() {
    await signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-md"
      style={{
        background: "color-mix(in srgb, var(--otto-bg) 92%, transparent)",
        borderBottom: "1px solid var(--otto-rule)",
      }}
    >
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-6 px-6 py-3.5 md:px-10">
        {/* LEFT — wordmark with crest */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[10px]"
            style={{
              background: "var(--otto-ink)",
              boxShadow: "0 4px 14px rgba(214,40,40,.30)",
            }}
          >
            <Image
              src="/logos/buho-seguridad.png"
              alt="OttoSeguridad"
              width={120}
              height={66}
              className="h-auto w-[34px] object-contain"
              priority
            />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className="font-display text-[18px] font-bold leading-none"
              style={{
                color: "var(--otto-ink)",
                letterSpacing: "-0.04em",
              }}
            >
              OttoSeguridad
            </span>
            <span
              className="font-mono-otto mt-1.5 leading-none"
              style={{
                color: "var(--otto-muted)",
                fontSize: "9px",
                letterSpacing: ".18em",
              }}
            >
              Resumen Diario · Edición Privada
            </span>
          </div>
        </Link>

        {/* CENTER — editorial nav (only when authenticated) */}
        {session?.user && visibleMenus.length > 0 ? (
          <nav className="hidden items-center md:flex">
            <ul className="flex items-center">
              {visibleMenus.map((menu, i) => {
                const active =
                  pathname === menu.href || pathname.startsWith(menu.href + "/");
                return (
                  <li
                    key={menu.slug}
                    className="relative"
                    style={
                      i > 0
                        ? { borderLeft: "1px solid var(--otto-rule)" }
                        : undefined
                    }
                  >
                    <Link
                      href={menu.href}
                      className="group relative flex items-center px-3.5 py-1.5 transition-colors lg:px-4"
                      style={{
                        color: active
                          ? "var(--otto-primary)"
                          : "var(--otto-ink-2)",
                      }}
                    >
                      <span
                        className="font-mono-otto"
                        style={{
                          fontSize: "10px",
                          letterSpacing: ".18em",
                          fontWeight: active ? 700 : 600,
                        }}
                      >
                        {menu.label}
                      </span>
                      {/* Underline marker */}
                      <span
                        className="pointer-events-none absolute inset-x-3.5 -bottom-[15px] h-[2px] origin-left transition-transform lg:inset-x-4"
                        style={{
                          background: "var(--otto-primary)",
                          transform: active ? "scaleX(1)" : "scaleX(0)",
                        }}
                      />
                      {/* Hover underline */}
                      {!active && (
                        <span
                          className="pointer-events-none absolute inset-x-3.5 -bottom-[15px] h-[2px] origin-left scale-x-0 transition-transform group-hover:scale-x-100 lg:inset-x-4"
                          style={{
                            background: "var(--otto-ink)",
                            opacity: 0.4,
                          }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        {/* RIGHT — auth + theme */}
        <div className="flex items-center gap-2">
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: "var(--otto-primary)",
                    letterSpacing: ".5px",
                    boxShadow: "0 4px 12px rgba(214,40,40,.30)",
                  }}
                  aria-label={session.user.name ?? "Cuenta"}
                >
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold leading-tight">
                    {session.user.name ?? "Sesión activa"}
                  </span>
                  {session.user.email ? (
                    <span
                      className="text-[11px] font-normal"
                      style={{ color: "var(--otto-muted)" }}
                    >
                      {session.user.email}
                    </span>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <span
                      className="font-mono-otto mr-2"
                      style={{
                        fontSize: "9px",
                        letterSpacing: ".18em",
                        color: "var(--otto-primary)",
                      }}
                    >
                      ◆
                    </span>
                    <span>Ir a la consola</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-3.5 w-3.5" strokeWidth={1.8} />
                    <span>Mi perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer focus:bg-[var(--otto-err-soft)] focus:text-[var(--otto-err)]"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" strokeWidth={1.8} />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold transition-all hover:-translate-y-0.5"
              style={{
                background: "var(--otto-primary)",
                color: "#fff",
                boxShadow: "0 4px 14px rgba(214,40,40,.28)",
              }}
            >
              <LogIn className="h-3.5 w-3.5" strokeWidth={2} />
              Iniciar sesión
            </Link>
          )}

          <div
            className="hidden h-6 w-px sm:block"
            style={{ background: "var(--otto-rule)" }}
          />

          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
