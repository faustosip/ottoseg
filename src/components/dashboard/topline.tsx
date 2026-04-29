"use client";

import { Search, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initialsFromName(name?: string | null, email?: string | null) {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "";
  if (!source) return "OS";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

type ToplineProps = {
  crumbs?: string[];
};

export function Topline({ crumbs = ["OttoSeguridad", "Console"] }: ToplineProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const initials = initialsFromName(session?.user?.name, session?.user?.email);

  async function handleSignOut() {
    await signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mb-[18px] flex items-center justify-between gap-[18px]">
      <div
        className="font-mono-otto"
        style={{
          fontSize: "10px",
          letterSpacing: ".16em",
          color: "var(--otto-muted)",
        }}
      >
        {crumbs.join(" / ")}
      </div>
      <div
        className="flex items-center gap-3 text-[12px]"
        style={{ color: "var(--otto-muted)" }}
      >
        <div
          className="flex w-[300px] items-center gap-2 rounded-[10px] px-3 py-2 text-[12px]"
          style={{
            background: "var(--otto-surface)",
            border: "1px solid var(--otto-rule)",
            color: "var(--otto-muted)",
          }}
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Buscar boletines, fuentes…"
            className="flex-1 border-none bg-transparent text-[12px] outline-none"
            style={{ color: "var(--otto-ink)" }}
          />
          <kbd
            className="font-mono-otto rounded px-[5px] py-[2px] text-[10px]"
            style={{
              background: "var(--otto-bg)",
              letterSpacing: ".05em",
              textTransform: "none",
            }}
          >
            ⌘K
          </kbd>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: "var(--otto-primary)",
                letterSpacing: ".5px",
              }}
              aria-label={session?.user?.name ?? "Cuenta"}
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold leading-tight">
                {session?.user?.name ?? "Sesión activa"}
              </span>
              {session?.user?.email ? (
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
      </div>
    </div>
  );
}
