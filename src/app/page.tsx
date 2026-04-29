import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Radio } from "lucide-react";

const FUENTES = [
  { num: "01", name: "El Comercio", domain: "elcomercio.com", articles: 71 },
  { num: "02", name: "Primicias", domain: "primicias.ec", articles: 71 },
  { num: "03", name: "La Hora", domain: "lahora.com.ec", articles: 71 },
  { num: "04", name: "Teleamazonas", domain: "teleamazonas.com", articles: 71 },
  { num: "05", name: "ECU 911", domain: "ecu911.gob.ec", articles: 73 },
];

const CATEGORIAS = [
  { name: "Última Hora", color: "#d62828" },
  { name: "Economía", color: "#0a7d3d" },
  { name: "Política", color: "#9b1c2d" },
  { name: "Sociedad", color: "#2563eb" },
  { name: "Seguridad", color: "#b91c1c" },
  { name: "Internacional", color: "#7c3aed" },
  { name: "Vial", color: "#b06b00" },
];

const PIPELINE = [
  { label: "Scraping", state: "ok" as const },
  { label: "Clasificación", state: "ok" as const },
  { label: "Resumen", state: "ok" as const },
  { label: "Video", state: "live" as const },
  { label: "Envío", state: "queued" as const },
];

export default function Home() {
  return (
    <main
      className="flex-1"
      style={{
        background: "var(--otto-bg)",
        color: "var(--otto-ink)",
      }}
    >
      {/* ============================================== */}
      {/* TOP STATUS STRIP — black bar, mono uppercase   */}
      {/* ============================================== */}
      <div
        className="w-full"
        style={{ background: "var(--otto-ink)", color: "#e8e6e1" }}
      >
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-2.5 md:px-10">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span
              className="font-mono-otto"
              style={{ color: "#e8e6e1", opacity: 0.9 }}
            >
              Edición Nº 247
            </span>
            <span
              className="font-mono-otto hidden sm:inline"
              style={{ color: "#e8e6e1", opacity: 0.55 }}
            >
              ·
            </span>
            <span
              className="font-mono-otto hidden sm:inline"
              style={{ color: "#e8e6e1", opacity: 0.7 }}
            >
              Mar 28 Abr 2026
            </span>
            <span
              className="font-mono-otto hidden md:inline"
              style={{ color: "#e8e6e1", opacity: 0.55 }}
            >
              ·
            </span>
            <span
              className="font-mono-otto hidden md:inline"
              style={{ color: "#e8e6e1", opacity: 0.7 }}
            >
              06:00 ECT
            </span>
          </div>
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
              style={{ color: "#e8e6e1" }}
            >
              Proceso activo · Renderizando video
            </span>
          </div>
        </div>
      </div>

      {/* ============================================== */}
      {/* MASTHEAD                                       */}
      {/* ============================================== */}
      <section className="mx-auto max-w-[1320px] px-6 pt-10 md:px-10 md:pt-16">
        <div
          className="flex items-center justify-between"
          style={{ color: "var(--otto-muted)" }}
        >
          <span className="font-mono-otto">
            Boletín Privado · Suscriptores OttoSeguridad
          </span>
          <span className="font-mono-otto hidden md:inline">
            Vol. 02 · Cuaderno A
          </span>
        </div>
        <div
          className="mt-4 h-px w-full"
          style={{ background: "var(--otto-ink)" }}
        />

        {/* Owl crest — newspaper-style emblem above the wordmark */}
        <div className="mt-8 flex justify-center md:mt-10">
          <div className="relative">
            <Image
              src="/logos/buho-seguridad.png"
              alt="Insignia OttoSeguridad"
              width={600}
              height={331}
              className="h-auto w-[200px] md:w-[280px] lg:w-[320px]"
              priority
              unoptimized
            />
          </div>
        </div>

        <h1
          className="font-display mt-3 text-center font-bold leading-[0.92] md:mt-4"
          style={{
            color: "var(--otto-ink)",
            letterSpacing: "-0.06em",
            fontSize: "clamp(64px, 13.5vw, 196px)",
          }}
        >
          OttoSeguridad
        </h1>
        <div
          className="mt-5 flex items-center justify-between gap-3"
          style={{ color: "var(--otto-muted)" }}
        >
          <span className="font-mono-otto hidden sm:inline">
            Servicio editorial exclusivo
          </span>
          <span
            className="font-mono-otto text-center sm:text-right"
            style={{ color: "var(--otto-ink-2)" }}
          >
            Hoy · Martes 28 de abril · Quito
          </span>
        </div>
        <div
          className="mt-3 h-[3px] w-full"
          style={{ background: "var(--otto-ink)" }}
        />
        <div
          className="mt-1 h-px w-full"
          style={{ background: "var(--otto-ink)" }}
        />
      </section>

      {/* ============================================== */}
      {/* HERO BROADSHEET                                */}
      {/* ============================================== */}
      <section className="mx-auto max-w-[1320px] px-6 pt-12 pb-20 md:px-10 md:pt-16 md:pb-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          {/* LEFT — editorial lede + CTA */}
          <div className="lg:col-span-5">
            <span
              className="font-mono-otto"
              style={{ color: "var(--otto-primary)" }}
            >
              ◆ Portada · Editorial
            </span>
            <h2
              className="font-display mt-6 font-bold"
              style={{
                color: "var(--otto-ink)",
                letterSpacing: "-0.04em",
                fontSize: "clamp(40px, 5.2vw, 68px)",
                lineHeight: 0.98,
              }}
            >
              El boletín que su equipo lee{" "}
              <em
                className="not-italic"
                style={{
                  color: "var(--otto-primary)",
                  fontStyle: "italic",
                  fontFamily: "var(--font-serif), Georgia, serif",
                  letterSpacing: "-0.02em",
                }}
              >
                a primera hora
              </em>
              .
            </h2>

            <p
              className="mt-7 max-w-[520px] text-[17px] leading-[1.6]"
              style={{ color: "var(--otto-ink-2)" }}
            >
              Una edición diaria preparada por OttoSeguridad para sus suscriptores:
              recopilamos, clasificamos y resumimos las noticias del país y la
              entregamos a las{" "}
              <strong style={{ color: "var(--otto-ink)" }}>
                seis de la mañana
              </strong>
              . Cinco medios, siete secciones, cero ruido: la inteligencia
              editorial que su organización necesita.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/bulletin"
                className="group inline-flex items-center gap-3 rounded-md px-6 py-3.5 text-[15px] font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  background: "var(--otto-primary)",
                  color: "#fff",
                  boxShadow: "var(--otto-shadow-2)",
                }}
              >
                Ver último boletín
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md border px-6 py-3.5 text-[15px] font-semibold transition-colors hover:bg-[var(--otto-rule-2)]"
                style={{
                  borderColor: "var(--otto-ink)",
                  color: "var(--otto-ink)",
                  background: "transparent",
                }}
              >
                Iniciar sesión
              </Link>
            </div>

            <div
              className="mt-10 grid grid-cols-3 gap-x-6 gap-y-2 border-t pt-6"
              style={{ borderColor: "var(--otto-rule)" }}
            >
              <div>
                <div
                  className="font-mono-otto"
                  style={{ color: "var(--otto-muted)" }}
                >
                  Hora de envío
                </div>
                <div
                  className="font-display mt-1 text-[24px] font-bold"
                  style={{ color: "var(--otto-ink)", letterSpacing: "-0.02em" }}
                >
                  06:00
                </div>
              </div>
              <div>
                <div
                  className="font-mono-otto"
                  style={{ color: "var(--otto-muted)" }}
                >
                  Fuentes
                </div>
                <div
                  className="font-display mt-1 text-[24px] font-bold"
                  style={{ color: "var(--otto-ink)", letterSpacing: "-0.02em" }}
                >
                  05
                </div>
              </div>
              <div>
                <div
                  className="font-mono-otto"
                  style={{ color: "var(--otto-muted)" }}
                >
                  Secciones
                </div>
                <div
                  className="font-display mt-1 text-[24px] font-bold"
                  style={{ color: "var(--otto-ink)", letterSpacing: "-0.02em" }}
                >
                  07
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — framed mockup with status sticker */}
          <div className="relative lg:col-span-7">
            <div
              className="relative overflow-hidden rounded-2xl border"
              style={{
                background: "var(--otto-surface)",
                borderColor: "var(--otto-rule)",
                boxShadow:
                  "0 30px 80px -20px rgba(14,14,16,0.18), 0 12px 30px -10px rgba(14,14,16,0.10)",
              }}
            >
              <div
                className="flex items-center justify-between border-b px-4 py-2.5"
                style={{ borderColor: "var(--otto-rule)" }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: "#fb6a5a" }}
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: "#fec231" }}
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: "#28c93f" }}
                  />
                </div>
                <span
                  className="font-mono-otto"
                  style={{ color: "var(--otto-muted)" }}
                >
                  app.ottoseguridadai.com / boletín · 28 abr 2026
                </span>
                <span style={{ width: 36 }} />
              </div>
              <div
                className="relative"
                style={{ background: "var(--otto-bg)" }}
              >
                <Image
                  src="/manual/screenshots/17-vista-publica.png"
                  alt="Vista pública del boletín OttoSeguridad"
                  width={1440}
                  height={900}
                  className="h-auto w-full"
                  priority
                  unoptimized
                />
              </div>
            </div>

            {/* Floating status sticker */}
            <div
              className="absolute -top-5 -left-4 hidden rounded-xl border px-5 py-3.5 sm:block lg:-left-8"
              style={{
                background: "var(--otto-ink)",
                borderColor: "var(--otto-ink)",
                boxShadow: "var(--otto-shadow-2)",
                color: "#fff",
              }}
            >
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5" style={{ color: "var(--otto-primary)" }} />
                <span
                  className="font-mono-otto"
                  style={{ color: "var(--otto-primary)" }}
                >
                  En vivo
                </span>
              </div>
              <div
                className="font-display mt-1 text-[18px] font-bold"
                style={{ letterSpacing: "-0.02em" }}
              >
                Listo para enviar a las 06:00
              </div>
              <div
                className="font-mono-otto mt-1"
                style={{ color: "#9a9aa0" }}
              >
                17 not. · 4 cat. · 2 destinatarios
              </div>
            </div>

            {/* Floating "next edition" tag */}
            <div
              className="absolute -right-3 -bottom-5 hidden rounded-xl border bg-white px-4 py-3 sm:block lg:-right-6"
              style={{
                borderColor: "var(--otto-rule)",
                boxShadow: "var(--otto-shadow-1)",
              }}
            >
              <div
                className="font-mono-otto"
                style={{ color: "var(--otto-muted)" }}
              >
                Próxima edición
              </div>
              <div
                className="font-display mt-0.5 text-[16px] font-bold"
                style={{ color: "var(--otto-ink)", letterSpacing: "-0.02em" }}
              >
                29 abr · 06:00
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* PIPELINE — process diagram                     */}
      {/* ============================================== */}
      <section
        className="border-y"
        style={{
          borderColor: "var(--otto-rule)",
          background: "var(--otto-surface)",
        }}
      >
        <div className="mx-auto max-w-[1320px] px-6 py-14 md:px-10 md:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <span
                className="font-mono-otto"
                style={{ color: "var(--otto-primary)" }}
              >
                Capítulo 01 · El proceso
              </span>
              <h3
                className="font-display mt-4 font-bold"
                style={{
                  color: "var(--otto-ink)",
                  letterSpacing: "-0.04em",
                  fontSize: "clamp(32px, 3.5vw, 44px)",
                  lineHeight: 1.02,
                }}
              >
                Cinco etapas, una sola edición.
              </h3>
              <p
                className="mt-5 max-w-[420px] text-[15px] leading-[1.65]"
                style={{ color: "var(--otto-ink-2)" }}
              >
                El proceso corre en paralelo desde las{" "}
                <strong style={{ color: "var(--otto-ink)" }}>
                  04:00 ECT
                </strong>{" "}
                y termina antes del envío. Cada etapa registra su estado,
                tiempo y errores en la consola editorial.
              </p>
            </div>
            <div className="lg:col-span-8">
              <div
                className="relative overflow-hidden rounded-2xl border p-6 md:p-8"
                style={{
                  background: "var(--otto-ink)",
                  borderColor: "var(--otto-ink)",
                  color: "#fff",
                  boxShadow: "var(--otto-shadow-2)",
                }}
              >
                <div
                  className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
                  style={{ background: "var(--otto-primary)" }}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <span
                    className="font-mono-otto"
                    style={{ color: "#9a9aa0" }}
                  >
                    Boletín 28 abr 2026 · Proceso
                  </span>
                  <span
                    className="font-mono-otto"
                    style={{ color: "var(--otto-primary)" }}
                  >
                    En curso
                  </span>
                </div>

                {/* Pipeline steps */}
                <div className="relative mt-8 grid grid-cols-5 gap-2">
                  {/* Connecting line */}
                  <div
                    className="absolute top-3 right-[10%] left-[10%] h-px"
                    style={{ background: "rgba(255,255,255,0.18)" }}
                  />
                  {PIPELINE.map((step, i) => {
                    const isOk = step.state === "ok";
                    const isLive = step.state === "live";
                    const isQueued = step.state === "queued";
                    return (
                      <div
                        key={step.label}
                        className="relative flex flex-col items-center text-center"
                      >
                        <div
                          className="relative flex h-6 w-6 items-center justify-center rounded-full"
                          style={{
                            background: isOk
                              ? "var(--otto-ok)"
                              : isLive
                                ? "var(--otto-primary)"
                                : "rgba(255,255,255,0.10)",
                            border: isQueued
                              ? "1px solid rgba(255,255,255,0.25)"
                              : "none",
                          }}
                        >
                          {isOk ? (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 6.5L4.8 9.2L10 3.5"
                                stroke="white"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : isLive ? (
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                            </span>
                          ) : (
                            <span
                              className="font-mono-otto"
                              style={{
                                color: "rgba(255,255,255,0.6)",
                                fontSize: 10,
                              }}
                            >
                              {i + 1}
                            </span>
                          )}
                        </div>
                        <div
                          className="mt-3 text-[13px] font-medium"
                          style={{
                            color: "#fff",
                            opacity: isQueued ? 0.55 : 1,
                          }}
                        >
                          {step.label}
                        </div>
                        <div
                          className="font-mono-otto mt-1"
                          style={{
                            color: isLive
                              ? "var(--otto-primary)"
                              : isOk
                                ? "var(--otto-ok)"
                                : "rgba(255,255,255,0.4)",
                          }}
                        >
                          {isOk ? "OK" : isLive ? "Render" : "En cola"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  className="mt-10 flex flex-wrap items-end justify-between gap-3 border-t pt-5"
                  style={{ borderColor: "rgba(255,255,255,0.10)" }}
                >
                  <div>
                    <div
                      className="font-mono-otto"
                      style={{ color: "#9a9aa0" }}
                    >
                      ETA total
                    </div>
                    <div
                      className="font-display mt-1 text-[28px] font-bold"
                      style={{
                        color: "#fff",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      00:01:42
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="font-mono-otto"
                      style={{ color: "#9a9aa0" }}
                    >
                      Notas procesadas
                    </div>
                    <div
                      className="font-display mt-1 text-[28px] font-bold"
                      style={{
                        color: "#fff",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      357
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* FUENTES — newspaper index                      */}
      {/* ============================================== */}
      <section className="mx-auto max-w-[1320px] px-6 py-20 md:px-10 md:py-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <span
              className="font-mono-otto"
              style={{ color: "var(--otto-primary)" }}
            >
              Capítulo 02 · La redacción
            </span>
            <h3
              className="font-display mt-4 font-bold"
              style={{
                color: "var(--otto-ink)",
                letterSpacing: "-0.04em",
                fontSize: "clamp(36px, 4.4vw, 56px)",
                lineHeight: 0.98,
              }}
            >
              Cinco fuentes
              <br />
              <em
                className="not-italic"
                style={{
                  color: "var(--otto-primary)",
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontStyle: "italic",
                }}
              >
                contrastadas
              </em>{" "}
              cada día.
            </h3>
            <p
              className="mt-6 max-w-[440px] text-[15px] leading-[1.65]"
              style={{ color: "var(--otto-ink-2)" }}
            >
              Cada madrugada, a las 04:00&nbsp;ECT, el sistema visita los
              principales medios del país, descarga los titulares y los pasa
              por el clasificador editorial. Solo lo verificado llega al
              boletín de sus suscriptores.
            </p>

            <div
              className="mt-8 inline-flex items-center gap-3 rounded-full border px-4 py-2"
              style={{
                borderColor: "var(--otto-rule)",
                background: "var(--otto-surface)",
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: "var(--otto-ok)" }}
              />
              <span
                className="font-mono-otto"
                style={{ color: "var(--otto-ink-2)" }}
              >
                Última corrida · hace 3 h
              </span>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div
              className="overflow-hidden rounded-2xl border"
              style={{
                background: "var(--otto-surface)",
                borderColor: "var(--otto-rule)",
                boxShadow: "var(--otto-shadow-1)",
              }}
            >
              <div
                className="flex items-center justify-between border-b px-6 py-3"
                style={{ borderColor: "var(--otto-rule)" }}
              >
                <span
                  className="font-mono-otto"
                  style={{ color: "var(--otto-muted)" }}
                >
                  Índice de fuentes
                </span>
                <span
                  className="font-mono-otto"
                  style={{ color: "var(--otto-muted)" }}
                >
                  Notas · 24 h
                </span>
              </div>
              <ul>
                {FUENTES.map((f, i) => (
                  <li
                    key={f.domain}
                    className="group flex items-center gap-4 px-6 py-5 transition-colors hover:bg-[var(--otto-rule-2)]"
                    style={{
                      borderTop:
                        i === 0 ? "none" : "1px solid var(--otto-rule)",
                    }}
                  >
                    <span
                      className="font-display flex h-12 w-12 flex-shrink-0 items-center justify-center text-[26px] font-bold"
                      style={{
                        color: "var(--otto-primary)",
                        letterSpacing: "-0.04em",
                      }}
                    >
                      {f.num}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-display text-[20px] font-bold leading-tight"
                        style={{
                          color: "var(--otto-ink)",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {f.name}
                      </div>
                      <div
                        className="font-mono-otto mt-1"
                        style={{ color: "var(--otto-muted)" }}
                      >
                        {f.domain}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="font-display text-[22px] font-bold"
                        style={{
                          color: "var(--otto-ink)",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {f.articles}
                      </div>
                      <div
                        className="font-mono-otto mt-0.5"
                        style={{ color: "var(--otto-ok)" }}
                      >
                        Success
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* CATEGORÍAS — colored stripe grid              */}
      {/* ============================================== */}
      <section
        className="border-y"
        style={{
          borderColor: "var(--otto-rule)",
          background: "var(--otto-surface)",
        }}
      >
        <div className="mx-auto max-w-[1320px] px-6 py-20 md:px-10 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span
                className="font-mono-otto"
                style={{ color: "var(--otto-primary)" }}
              >
                Capítulo 03 · La estructura
              </span>
              <h3
                className="font-display mt-4 font-bold"
                style={{
                  color: "var(--otto-ink)",
                  letterSpacing: "-0.04em",
                  fontSize: "clamp(36px, 4.4vw, 56px)",
                  lineHeight: 0.98,
                }}
              >
                Siete secciones
                <br />
                editoriales.
              </h3>
            </div>
            <p
              className="max-w-[420px] text-[15px] leading-[1.65]"
              style={{ color: "var(--otto-ink-2)" }}
            >
              El clasificador asigna cada titular a una sección. El orden de
              aparición en la edición pública es configurable desde la consola.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIAS.map((c, i) => (
              <div
                key={c.name}
                className="group relative overflow-hidden rounded-xl border bg-white p-5 transition-shadow hover:shadow-lg"
                style={{
                  borderColor: "var(--otto-rule)",
                  borderLeft: `4px solid ${c.color}`,
                  boxShadow: "var(--otto-shadow-1)",
                }}
              >
                <div
                  className="font-mono-otto"
                  style={{ color: "var(--otto-muted)" }}
                >
                  Sección {String(i + 1).padStart(2, "0")}
                </div>
                <div
                  className="font-display mt-1.5 text-[22px] font-bold leading-tight"
                  style={{
                    color: "var(--otto-ink)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {c.name}
                </div>
                <div
                  className="mt-4 inline-flex items-center gap-1.5 text-[12px]"
                  style={{ color: "var(--otto-muted)" }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: c.color }}
                  />
                  Activa
                </div>
              </div>
            ))}

            {/* "Vacío" placeholder — like a category slot */}
            <div
              className="rounded-xl border-2 border-dashed p-5"
              style={{
                borderColor: "var(--otto-rule)",
                background: "transparent",
              }}
            >
              <div
                className="font-mono-otto"
                style={{ color: "var(--otto-muted)" }}
              >
                Sección 08
              </div>
              <div
                className="font-display mt-1.5 text-[22px] font-bold leading-tight"
                style={{
                  color: "var(--otto-muted)",
                  letterSpacing: "-0.02em",
                }}
              >
                Personalizada
              </div>
              <div
                className="mt-4 text-[12px]"
                style={{ color: "var(--otto-muted)" }}
              >
                Cree la suya desde la consola.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* SECOND VISUAL PROOF — dashboard mockup        */}
      {/* ============================================== */}
      <section className="mx-auto max-w-[1320px] px-6 py-20 md:px-10 md:py-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-14">
          <div className="order-2 lg:order-1 lg:col-span-7">
            <div
              className="overflow-hidden rounded-2xl border"
              style={{
                borderColor: "var(--otto-rule)",
                boxShadow:
                  "0 30px 80px -20px rgba(14,14,16,0.18), 0 12px 30px -10px rgba(14,14,16,0.10)",
              }}
            >
              <Image
                src="/manual/screenshots/03-dashboard.png"
                alt="Consola editorial OttoSeguridad — vista Hoy"
                width={1440}
                height={900}
                className="h-auto w-full"
                unoptimized
              />
            </div>
          </div>
          <div className="order-1 lg:order-2 lg:col-span-5">
            <span
              className="font-mono-otto"
              style={{ color: "var(--otto-primary)" }}
            >
              Capítulo 04 · La consola
            </span>
            <h3
              className="font-display mt-4 font-bold"
              style={{
                color: "var(--otto-ink)",
                letterSpacing: "-0.04em",
                fontSize: "clamp(34px, 4vw, 50px)",
                lineHeight: 0.98,
              }}
            >
              Su redacción privada,
              <br />
              <em
                className="not-italic"
                style={{
                  color: "var(--otto-primary)",
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontStyle: "italic",
                }}
              >
                en tiempo real
              </em>
              .
            </h3>
            <p
              className="mt-6 text-[15px] leading-[1.65]"
              style={{ color: "var(--otto-ink-2)" }}
            >
              Apertura del último envío, alta de suscriptores, boletines de la
              semana y el tiempo promedio del proceso conviven en una sola
              pantalla. Su equipo editorial controla cada edición antes de que
              llegue a la lista.
            </p>
            <ul
              className="mt-8 space-y-3 text-[14px]"
              style={{ color: "var(--otto-ink-2)" }}
            >
              {[
                "Auditoría editorial inmutable por boletín",
                "Estilos clásico y moderno, intercambiables",
                "Roles del equipo: Admin, Editor, Viewer",
                "Lista de suscriptores con engagement por persona",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ background: "var(--otto-primary)" }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* CLOSING CTA — full-width black panel           */}
      {/* ============================================== */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--otto-ink)", color: "#fff" }}
      >
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--otto-primary)" }}
        />
        {/* Decorative owl seal — giant, centered, behind text */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <Image
            src="/logos/buho-seguridad.png"
            alt=""
            width={1200}
            height={663}
            className="h-auto w-[78%] max-w-[860px] opacity-[0.06]"
            unoptimized
          />
        </div>
        <div className="relative mx-auto max-w-[1320px] px-6 py-20 text-center md:px-10 md:py-28">
          <span
            className="font-mono-otto"
            style={{ color: "var(--otto-primary)" }}
          >
            ◆ Próxima edición · 29 abr · 06:00
          </span>
          <h3
            className="font-display mx-auto mt-6 max-w-[900px] font-bold"
            style={{
              color: "#fff",
              letterSpacing: "-0.04em",
              fontSize: "clamp(40px, 6vw, 84px)",
              lineHeight: 0.95,
            }}
          >
            Su resumen diario de noticias,
            <br />
            <em
              className="not-italic"
              style={{
                color: "var(--otto-primary)",
                fontFamily: "var(--font-serif), Georgia, serif",
                fontStyle: "italic",
              }}
            >
              en la bandeja de sus lectores.
            </em>
          </h3>
          <p
            className="mx-auto mt-6 max-w-[560px] text-[16px] leading-[1.6]"
            style={{ color: "#bdbdc1" }}
          >
            Servicio exclusivo para suscriptores OttoSeguridad. Entre a la consola
            editorial para revisar la próxima edición o consultar el último
            boletín publicado.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard/bulletin"
              className="group inline-flex items-center gap-3 rounded-md px-7 py-4 text-[15px] font-semibold transition-all hover:-translate-y-0.5"
              style={{
                background: "var(--otto-primary)",
                color: "#fff",
                boxShadow: "var(--otto-shadow-2)",
              }}
            >
              Ver último boletín
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md border px-7 py-4 text-[15px] font-semibold transition-colors hover:bg-white/10"
              style={{
                borderColor: "rgba(255,255,255,0.30)",
                color: "#fff",
                background: "transparent",
              }}
            >
              Iniciar sesión
            </Link>
          </div>

          {/* Otto wordmark + meta line */}
          <div
            className="mx-auto mt-16 flex max-w-[760px] flex-col items-center gap-5 border-t pt-8"
            style={{ borderColor: "rgba(255,255,255,0.10)" }}
          >
            <Image
              src="/logos/buho-seguridad.png"
              alt="OttoSeguridad"
              width={600}
              height={331}
              className="h-auto w-[180px] opacity-95"
              unoptimized
            />
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              <span
                className="font-mono-otto"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Servicio privado
              </span>
              <span
                className="font-mono-otto"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Edición Nº 247
              </span>
              <span
                className="font-mono-otto"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Vol. 02 · Quito
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
