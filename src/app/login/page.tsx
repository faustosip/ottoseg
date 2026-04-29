"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Lock, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (session && !isPending) {
    router.replace("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email y contraseña son requeridos");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.email({
        email: email.trim(),
        password,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setError("Credenciales incorrectas. Verifica tu email y contraseña.");
        return;
      }

      const meRes = await fetch("/api/admin/users/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        if (!meData.isActive) {
          await signOut();
          setError("Tu cuenta ha sido desactivada. Contacta al administrador.");
          return;
        }
      }
    } catch {
      setError("Error al iniciar sesión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const year = new Date().getFullYear();

  return (
    <main
      className="grid min-h-[calc(100vh-69px)] grid-cols-1 lg:grid-cols-[1.05fr_1fr]"
      style={{ background: "var(--otto-bg)" }}
    >
      {/* ============================================== */}
      {/* LEFT — editorial dark panel                    */}
      {/* ============================================== */}
      <section
        className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14"
        style={{ background: "var(--otto-ink)", color: "#fff" }}
      >
        {/* Red glow */}
        <div
          className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--otto-primary)" }}
        />
        {/* Owl decorative seal */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <Image
            src="/logos/buho-seguridad.png"
            alt=""
            width={1200}
            height={663}
            className="h-auto w-[78%] max-w-[640px] opacity-[0.05]"
            unoptimized
          />
        </div>

        {/* TOP — masthead label */}
        <div className="relative z-10 flex items-center justify-between">
          <span
            className="font-mono-otto"
            style={{
              color: "var(--otto-primary)",
              fontSize: "10px",
              letterSpacing: ".22em",
            }}
          >
            ◆ Edición Privada · OttoSeguridad
          </span>
          <span
            className="font-mono-otto"
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "10px",
              letterSpacing: ".22em",
            }}
          >
            Vol. 02
          </span>
        </div>

        {/* CENTER — quote / lede */}
        <div className="relative z-10 max-w-[480px]">
          <h2
            className="font-display font-bold"
            style={{
              letterSpacing: "-0.04em",
              fontSize: "clamp(40px, 4.4vw, 60px)",
              lineHeight: 0.98,
            }}
          >
            Su consola
            <br />
            editorial,{" "}
            <em
              className="not-italic"
              style={{
                color: "var(--otto-primary)",
                fontFamily: "var(--font-serif), Georgia, serif",
                fontStyle: "italic",
              }}
            >
              diaria
            </em>
            .
          </h2>
          <p
            className="mt-6 max-w-[440px] text-[15px] leading-[1.65]"
            style={{ color: "#bdbdc1" }}
          >
            Acceda al panel donde se prepara, autoriza y envía el resumen
            diario de noticias para los suscriptores de OttoSeguridad.
          </p>

          <div
            className="mt-10 grid grid-cols-3 gap-x-6 gap-y-2 border-t pt-6"
            style={{ borderColor: "rgba(255,255,255,0.10)" }}
          >
            <div>
              <div
                className="font-mono-otto"
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "10px",
                  letterSpacing: ".18em",
                }}
              >
                Hora envío
              </div>
              <div
                className="font-display mt-1 text-[22px] font-bold"
                style={{ letterSpacing: "-0.02em" }}
              >
                06:00
              </div>
            </div>
            <div>
              <div
                className="font-mono-otto"
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "10px",
                  letterSpacing: ".18em",
                }}
              >
                Fuentes
              </div>
              <div
                className="font-display mt-1 text-[22px] font-bold"
                style={{ letterSpacing: "-0.02em" }}
              >
                05
              </div>
            </div>
            <div>
              <div
                className="font-mono-otto"
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "10px",
                  letterSpacing: ".18em",
                }}
              >
                Secciones
              </div>
              <div
                className="font-display mt-1 text-[22px] font-bold"
                style={{ letterSpacing: "-0.02em" }}
              >
                07
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM — meta */}
        <div
          className="relative z-10 flex items-center justify-between border-t pt-6"
          style={{ borderColor: "rgba(255,255,255,0.10)" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="relative inline-flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ background: "var(--otto-primary)" }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: "var(--otto-primary)" }}
              />
            </span>
            <span
              className="font-mono-otto"
              style={{
                color: "#fff",
                fontSize: "10px",
                letterSpacing: ".22em",
              }}
            >
              Proceso activo
            </span>
          </div>
          <span
            className="font-mono-otto"
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "10px",
              letterSpacing: ".22em",
            }}
          >
            Quito · Ecuador
          </span>
        </div>
      </section>

      {/* ============================================== */}
      {/* RIGHT — form panel                             */}
      {/* ============================================== */}
      <section className="relative flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        {/* Mobile-only top owl seal (faint) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-6 lg:hidden"
        >
          <Image
            src="/logos/buho-seguridad.png"
            alt=""
            width={400}
            height={221}
            className="h-auto w-[120px] opacity-[0.06]"
            unoptimized
          />
        </div>

        <div className="relative w-full max-w-[440px]">
          {/* Section label */}
          <div className="flex items-center gap-2">
            <Lock
              className="h-3.5 w-3.5"
              style={{ color: "var(--otto-primary)" }}
              strokeWidth={2}
            />
            <span
              className="font-mono-otto"
              style={{
                color: "var(--otto-primary)",
                fontSize: "10px",
                letterSpacing: ".22em",
              }}
            >
              Acceso restringido
            </span>
          </div>

          <h1
            className="font-display mt-4 font-bold"
            style={{
              color: "var(--otto-ink)",
              letterSpacing: "-0.04em",
              fontSize: "clamp(34px, 3.6vw, 46px)",
              lineHeight: 1,
            }}
          >
            Iniciar sesión
          </h1>
          <p
            className="mt-3 text-[14px] leading-[1.55]"
            style={{ color: "var(--otto-muted)" }}
          >
            Ingrese sus credenciales editoriales para acceder a la consola.
          </p>

          {/* Hairline separator */}
          <div
            className="mt-7 h-px w-full"
            style={{ background: "var(--otto-rule)" }}
          />

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="font-mono-otto block"
                style={{
                  color: "var(--otto-ink-2)",
                  fontSize: "10px",
                  letterSpacing: ".22em",
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                autoFocus
                className="mt-2 block w-full border-0 border-b bg-transparent px-0 py-2.5 text-[16px] outline-none transition-colors placeholder:text-[var(--otto-muted)] focus:border-[var(--otto-primary)] disabled:opacity-50"
                style={{
                  borderBottom: "1.5px solid var(--otto-rule)",
                  color: "var(--otto-ink)",
                }}
              />
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="font-mono-otto block"
                style={{
                  color: "var(--otto-ink-2)",
                  fontSize: "10px",
                  letterSpacing: ".22em",
                }}
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                className="mt-2 block w-full border-0 border-b bg-transparent px-0 py-2.5 text-[16px] outline-none transition-colors placeholder:text-[var(--otto-muted)] focus:border-[var(--otto-primary)] disabled:opacity-50"
                style={{
                  borderBottom: "1.5px solid var(--otto-rule)",
                  color: "var(--otto-ink)",
                }}
              />
            </div>

            {/* Error message */}
            {error && (
              <div
                className="flex items-start gap-2.5 rounded-lg p-3 pl-4"
                style={{
                  background: "var(--otto-err-soft)",
                  borderLeft: "3px solid var(--otto-err)",
                }}
              >
                <AlertCircle
                  className="mt-0.5 h-4 w-4 flex-shrink-0"
                  style={{ color: "var(--otto-err)" }}
                  strokeWidth={2}
                />
                <p
                  className="m-0 text-[13px] leading-[1.45]"
                  style={{ color: "var(--otto-err)" }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group mt-2 inline-flex w-full items-center justify-center gap-3 rounded-md px-6 py-3.5 text-[15px] font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              style={{
                background: "var(--otto-primary)",
                color: "#fff",
                boxShadow: "0 8px 22px rgba(214,40,40,.30)",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Iniciando sesión…</span>
                </>
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Help line */}
          <p
            className="mt-7 text-[13px] leading-[1.55]"
            style={{ color: "var(--otto-muted)" }}
          >
            ¿Problemas para acceder? Su cuenta puede estar inactiva.{" "}
            <span style={{ color: "var(--otto-ink-2)" }}>
              Contacte al administrador del sistema.
            </span>
          </p>

          {/* Footer */}
          <div
            className="mt-10 flex items-center justify-between border-t pt-5"
            style={{ borderColor: "var(--otto-rule)" }}
          >
            <span
              className="font-mono-otto"
              style={{
                color: "var(--otto-muted)",
                fontSize: "10px",
                letterSpacing: ".22em",
              }}
            >
              OttoSeguridad © {year}
            </span>
            <span
              className="font-mono-otto"
              style={{
                color: "var(--otto-muted)",
                fontSize: "10px",
                letterSpacing: ".22em",
              }}
            >
              Servicio privado
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
