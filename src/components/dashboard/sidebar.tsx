"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  List,
  Plus,
  Users,
  RefreshCw,
  LayoutGrid,
  UserCog,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth-client";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k.toFixed(k < 10 ? 1 : 0).replace(/\.0$/, "")}k`;
  }
  return String(n);
}

function buildNav(subscriberCount: number): NavGroup[] {
  return [
    {
      group: "Operación",
      items: [
        { href: "/dashboard", label: "Hoy", icon: Home, badge: "live" },
        { href: "/dashboard/bulletin", label: "Boletines", icon: List },
        { href: "/dashboard/bulletin/generate", label: "Generar", icon: Plus },
      ],
    },
    {
      group: "Audiencia",
      items: [
        {
          href: "/dashboard/subscribers",
          label: "Suscriptores",
          icon: Users,
          badge: subscriberCount > 0 ? formatCount(subscriberCount) : undefined,
        },
      ],
    },
    {
      group: "Configuración",
      items: [
        {
          href: "/dashboard/settings/sources",
          label: "Fuentes",
          icon: RefreshCw,
        },
        {
          href: "/dashboard/settings/categories",
          label: "Categorías",
          icon: LayoutGrid,
        },
        {
          href: "/dashboard/settings/users",
          label: "Usuarios",
          icon: UserCog,
        },
      ],
    },
  ];
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

interface SidebarProps {
  subscriberCount?: number;
}

export function Sidebar({ subscriberCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const NAV = buildNav(subscriberCount);

  const userName = session?.user?.name ?? "Usuario";
  const userEmail = session?.user?.email ?? "";

  async function handleSignOut() {
    await signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <aside
      className="sticky top-0 flex h-screen flex-col px-3.5 py-4 text-[13px]"
      style={{ background: "var(--otto-ink)", color: "#bdbdc4" }}
    >
      <div
        className="flex items-center gap-2.5 px-1.5 pb-5"
        style={{ borderBottom: "1px solid #2a2a2d" }}
      >
        <div
          className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[10px]"
          style={{
            background: "#000",
            boxShadow: "0 4px 14px rgba(214,40,40,.35)",
          }}
        >
          <Image
            src="/logos/buho-seguridad.png"
            alt="OttoSeguridad"
            width={120}
            height={64}
            className="h-auto w-[48px] object-contain"
            priority
          />
        </div>
        <div className="font-display text-[14px] font-bold leading-none text-white">
          OttoSeguridad
          <small
            className="font-mono-otto mt-1 block text-[9px] font-medium"
            style={{ color: "#7c7c83", letterSpacing: ".18em" }}
          >
            Console
          </small>
        </div>
      </div>

      {NAV.map((section) => (
        <div key={section.group}>
          <div
            className="font-mono-otto px-1.5 pb-1.5 pt-[18px]"
            style={{
              fontSize: "9px",
              letterSpacing: ".16em",
              color: "#5d5d63",
            }}
          >
            {section.group}
          </div>
          <nav className="flex flex-col">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    active ? "text-white" : "text-[#bdbdc4] hover:bg-[#1c1c1f] hover:text-white",
                  )}
                  style={
                    active
                      ? {
                          background: "var(--otto-primary)",
                          boxShadow: "0 4px 12px rgba(214,40,40,.3)",
                        }
                      : undefined
                  }
                >
                  <Icon className="h-3.5 w-3.5 flex-none opacity-90" strokeWidth={1.6} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span
                      className="font-mono-otto rounded-[10px] px-[7px] py-[2px] text-[9px] font-semibold"
                      style={{
                        background: active ? "rgba(0,0,0,.22)" : "rgba(255,255,255,.08)",
                        color: active ? "#fff" : "#bdbdc4",
                        letterSpacing: ".06em",
                      }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      <div className="mx-1.5 mt-auto flex flex-col gap-2">
        <div
          className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-[11px] leading-tight"
          style={{ background: "#1c1c1f", color: "#9d9da3" }}
        >
          <span
            className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
            style={{
              background: "#3ad075",
              boxShadow: "0 0 0 3px rgba(58,208,117,.18)",
            }}
          />
          <span className="font-semibold text-white">Pipeline activo</span>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="group flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[12px] transition-colors hover:bg-[#2a1416]"
          style={{
            background: "#1c1c1f",
            color: "#bdbdc4",
            border: "1px solid #2a2a2d",
          }}
          title={userEmail || undefined}
        >
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: "var(--otto-primary)" }}
          >
            {(userName || "U")
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((s) => s[0])
              .join("")
              .toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-white">
              {userName}
            </div>
            <div
              className="font-mono-otto truncate text-[9px] transition-colors group-hover:text-[var(--otto-primary)]"
              style={{ color: "#7c7c83", letterSpacing: ".14em" }}
            >
              Cerrar sesión
            </div>
          </div>
          <LogOut
            className="h-3.5 w-3.5 flex-shrink-0 transition-colors group-hover:text-[var(--otto-primary)]"
            strokeWidth={1.8}
            style={{ color: "#7c7c83" }}
          />
        </button>
      </div>
    </aside>
  );
}
