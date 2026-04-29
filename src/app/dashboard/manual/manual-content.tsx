"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  LogIn,
  LayoutDashboard,
  Newspaper,
  Plus,
  Eye,
  Send,
  Settings,
  Users,
  Tag,
  Rss,
  FileText,
  Shield,
  Video,
  ScrollText,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

type Section = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const sections: Section[] = [
  { id: "intro", label: "Introducción al sistema", icon: BookOpen },
  { id: "login", label: "Inicio de sesión", icon: LogIn },
  { id: "dashboard", label: "Dashboard ejecutivo", icon: LayoutDashboard },
  { id: "navegacion", label: "Menú de navegación", icon: ScrollText },
  { id: "boletines", label: "Lista de boletines", icon: Newspaper },
  { id: "generar", label: "Generar nuevo boletín", icon: Plus },
  { id: "detalle", label: "Detalle del boletín", icon: FileText },
  { id: "noticias", label: "Tab Noticias", icon: Rss },
  { id: "editar", label: "Tab Editar", icon: Settings },
  { id: "auditoria", label: "Tab Auditoría", icon: Shield },
  { id: "publicar", label: "Autorizar y publicar", icon: Send },
  { id: "vista-publica", label: "Vista pública", icon: Eye },
  { id: "fuentes", label: "Configuración de fuentes", icon: Rss },
  { id: "suscriptores", label: "Gestión de suscriptores", icon: Users },
  { id: "categorias", label: "Gestión de categorías", icon: Tag },
  { id: "usuarios", label: "Administración de usuarios", icon: Users },
  { id: "email", label: "Envío de correos", icon: Mail },
  { id: "video", label: "Video tutorial", icon: Video },
];

function ScreenshotImg({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="my-6">
      <div
        className="overflow-hidden rounded-xl border"
        style={{
          borderColor: "var(--otto-rule)",
          background: "var(--otto-surface)",
          boxShadow: "var(--otto-shadow-1)",
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={1440}
          height={900}
          className="h-auto w-full"
          unoptimized
        />
      </div>
      {caption ? (
        <figcaption
          className="font-mono-otto mt-3 text-center"
          style={{ color: "var(--otto-muted)" }}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function StepBox({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <div className="my-4 flex items-start gap-4">
      <div
        className="font-mono-otto flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white"
        style={{
          background: "var(--otto-primary)",
          letterSpacing: 0,
          fontSize: "12px",
        }}
      >
        {String(number).padStart(2, "0")}
      </div>
      <div
        className="flex-1 pt-1 text-[15px] leading-[1.6]"
        style={{ color: "var(--otto-ink-2)" }}
      >
        {children}
      </div>
    </div>
  );
}

function SectionTitle({
  id,
  index,
  icon: Icon,
  children,
}: {
  id: string;
  index: number;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-14 mb-5 scroll-mt-24" id={id}>
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: "var(--otto-primary-soft)" }}
        >
          <Icon
            className="h-6 w-6"
            style={{ color: "var(--otto-primary)" }}
          />
        </div>
        <div>
          <span
            className="font-mono-otto block"
            style={{ color: "var(--otto-primary)" }}
          >
            Capítulo {String(index).padStart(2, "0")}
          </span>
          <h2
            className="font-display m-0 text-[28px] font-bold leading-tight"
            style={{ color: "var(--otto-ink)", letterSpacing: "-0.8px" }}
          >
            {children}
          </h2>
        </div>
      </div>
      <div
        className="mt-4 h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, var(--otto-primary) 0%, var(--otto-primary) 56px, var(--otto-rule) 56px)",
        }}
      />
    </div>
  );
}

function Subheading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-display mt-8 mb-3 text-[18px] font-semibold"
      style={{ color: "var(--otto-ink)", letterSpacing: "-0.3px" }}
    >
      {children}
    </h3>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="my-3 text-[15px] leading-[1.7]"
      style={{ color: "var(--otto-ink-2)" }}
    >
      {children}
    </p>
  );
}

function BulletList({ children }: { children: React.ReactNode }) {
  return (
    <ul
      className="my-3 list-disc space-y-2 pl-5 text-[15px] leading-[1.65]"
      style={{ color: "var(--otto-ink-2)" }}
    >
      {children}
    </ul>
  );
}

function ImportantBox({
  label = "Importante",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="my-5 rounded-lg p-4 pl-5"
      style={{
        background: "var(--otto-primary-soft)",
        borderLeft: "4px solid var(--otto-primary)",
      }}
    >
      <p
        className="m-0 text-[14px] leading-[1.65]"
        style={{ color: "var(--otto-primary-ink)" }}
      >
        <strong className="font-display font-bold">{label}:</strong>{" "}
        <span style={{ color: "var(--otto-ink-2)" }}>{children}</span>
      </p>
    </div>
  );
}

function NoteBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="my-5 rounded-lg p-4 pl-5"
      style={{
        background: "var(--otto-warn-soft)",
        borderLeft: "4px solid var(--otto-warn)",
      }}
    >
      <p
        className="m-0 text-[14px] leading-[1.65]"
        style={{ color: "var(--otto-ink-2)" }}
      >
        <strong
          className="font-display font-bold"
          style={{ color: "var(--otto-warn)" }}
        >
          Atención:
        </strong>{" "}
        {children}
      </p>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="font-mono-otto rounded px-1.5 py-0.5"
      style={{
        background: "var(--otto-primary-soft)",
        color: "var(--otto-primary-ink)",
        fontSize: "12px",
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </code>
  );
}

function StatusPill({
  label,
  variant,
}: {
  label: string;
  variant: "muted" | "info" | "ok" | "okStrong" | "err";
}) {
  const styles: Record<string, { bg: string; color: string }> = {
    muted: { bg: "var(--otto-rule-2)", color: "var(--otto-ink-2)" },
    info: { bg: "#dbeafe", color: "#1d4ed8" },
    ok: { bg: "var(--otto-ok-soft)", color: "var(--otto-ok)" },
    okStrong: { bg: "var(--otto-ok)", color: "#fff" },
    err: { bg: "var(--otto-err-soft)", color: "var(--otto-err)" },
  };
  const s = styles[variant];
  return (
    <span
      className="font-mono-otto inline-flex rounded-full px-3 py-1"
      style={{ background: s.bg, color: s.color, fontSize: "10px" }}
    >
      {label}
    </span>
  );
}

export function ManualContent() {
  const [activeId, setActiveId] = useState<string>(sections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-30% 0px -60% 0px",
        threshold: 0,
      },
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <PageHeader
        title={
          <>
            Manual de uso{" "}
            <em className="not-italic" style={{ color: "var(--otto-primary)" }}>
              OttoSeguridad
            </em>
          </>
        }
        lede="Guía completa del sistema de boletines de seguridad: del primer login al envío masivo, configuración avanzada y administración del equipo editorial."
      />

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* INDEX SIDEBAR */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "var(--otto-surface)",
              borderColor: "var(--otto-rule)",
              boxShadow: "var(--otto-shadow-1)",
            }}
          >
            <div className="mb-5 flex items-center gap-2">
              <BookOpen
                className="h-4 w-4"
                style={{ color: "var(--otto-primary)" }}
              />
              <span
                className="font-mono-otto"
                style={{ color: "var(--otto-ink-2)" }}
              >
                Índice
              </span>
            </div>
            <nav>
              <ul className="space-y-3">
                {sections.map((section, idx) => {
                  const num = String(idx + 1).padStart(2, "0");
                  const isActive = activeId === section.id;
                  return (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="group flex items-baseline gap-3 transition-colors"
                        style={{
                          color: isActive
                            ? "var(--otto-ink)"
                            : "var(--otto-ink-2)",
                        }}
                      >
                        <span
                          className="font-mono-otto flex-shrink-0"
                          style={{
                            color: isActive
                              ? "var(--otto-primary)"
                              : "var(--otto-primary)",
                            opacity: isActive ? 1 : 0.55,
                            fontSize: "11px",
                          }}
                        >
                          {num}
                        </span>
                        <span
                          className="text-[14px] leading-[1.4] transition-colors group-hover:text-[var(--otto-primary)]"
                          style={{
                            fontWeight: isActive ? 600 : 400,
                          }}
                        >
                          {section.label}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div
              className="mt-6 border-t pt-5"
              style={{ borderColor: "var(--otto-rule)" }}
            >
              <span
                className="font-mono-otto block"
                style={{ color: "var(--otto-muted)" }}
              >
                Versión 1.0 · Abr 2026
              </span>
              <p
                className="mt-2 text-[12px] leading-[1.5]"
                style={{ color: "var(--otto-muted)" }}
              >
                ¿Necesita ayuda? Contacte al administrador del sistema.
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <article
          className="min-w-0"
          style={{ color: "var(--otto-ink-2)" }}
        >
          {/* INTRO */}
          <SectionTitle id="intro" index={1} icon={BookOpen}>
            Introducción al sistema
          </SectionTitle>
          <Paragraph>
            <strong style={{ color: "var(--otto-ink)" }}>OttoSeguridad</strong>{" "}
            es una plataforma de generación automatizada de boletines de
            noticias de seguridad para Ecuador. El sistema recopila noticias de
            múltiples fuentes periodísticas ecuatorianas, las clasifica
            mediante inteligencia artificial, genera resúmenes y permite su
            distribución por correo electrónico a suscriptores.
          </Paragraph>
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              {
                title: "Recopilación automática",
                desc: "Noticias de Primicias, La Hora, El Comercio, Teleamazonas y ECU911",
              },
              {
                title: "Clasificación con IA",
                desc: "Categorización automática en Economía, Política, Sociedad, Seguridad, Internacional y Vial",
              },
              {
                title: "Distribución por email",
                desc: "Envío masivo a suscriptores con seguimiento de apertura y clicks",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border p-4"
                style={{
                  background: "var(--otto-surface)",
                  borderColor: "var(--otto-rule)",
                  boxShadow: "var(--otto-shadow-1)",
                }}
              >
                <h4
                  className="font-display mb-1 text-[15px] font-semibold"
                  style={{ color: "var(--otto-ink)" }}
                >
                  {card.title}
                </h4>
                <p
                  className="m-0 text-[13px] leading-[1.5]"
                  style={{ color: "var(--otto-muted)" }}
                >
                  {card.desc}
                </p>
              </div>
            ))}
          </div>

          {/* LOGIN */}
          <SectionTitle id="login" index={2} icon={LogIn}>
            Inicio de sesión
          </SectionTitle>
          <Paragraph>
            Para acceder al sistema, ingrese a{" "}
            <Code>app.ottoseguridadai.com</Code> y utilice sus credenciales
            de acceso provistas por el administrador.
          </Paragraph>
          <StepBox number={1}>
            Abra su navegador y vaya a la URL del sistema. Verá la pantalla de
            inicio de sesión.
          </StepBox>
          <ScreenshotImg
            src="/manual/screenshots/01-login.png"
            alt="Pantalla de inicio de sesión"
            caption="Pantalla de inicio de sesión de OttoSeguridad"
          />
          <StepBox number={2}>
            Ingrese su <strong>correo electrónico</strong> y{" "}
            <strong>contraseña</strong> proporcionados por el administrador.
          </StepBox>
          <ScreenshotImg
            src="/manual/screenshots/02-login-filled.png"
            alt="Login con credenciales"
            caption="Ingreso de credenciales de acceso"
          />
          <StepBox number={3}>
            Haga clic en <strong>&quot;Iniciar sesión&quot;</strong>. Será
            redirigido al Dashboard principal.
          </StepBox>
          <ImportantBox>
            Si su cuenta ha sido desactivada por el administrador, recibirá un
            mensaje de error. Contacte al administrador para reactivar su
            cuenta.
          </ImportantBox>

          {/* DASHBOARD */}
          <SectionTitle id="dashboard" index={3} icon={LayoutDashboard}>
            Dashboard ejecutivo
          </SectionTitle>
          <Paragraph>
            El Dashboard es la pantalla principal del sistema. Muestra
            indicadores clave de rendimiento (KPIs), gráficos de tendencias y
            la actividad reciente del equipo editorial.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/03-dashboard.png"
            alt="Dashboard ejecutivo"
            caption="Dashboard ejecutivo con KPIs, gráficos y actividad reciente"
          />
          <Subheading>Indicadores KPI</Subheading>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              {
                color: "var(--otto-primary)",
                title: "Boletines publicados",
                desc: "Total de boletines que han sido autorizados y publicados.",
              },
              {
                color: "var(--otto-ok)",
                title: "Suscriptores activos",
                desc: "Cantidad de suscriptores que reciben los boletines.",
              },
              {
                color: "var(--otto-warn)",
                title: "Tasa de apertura",
                desc: "Porcentaje de emails abiertos vs enviados.",
              },
              {
                color: "var(--otto-ink)",
                title: "Noticias procesadas",
                desc: "Total de noticias recopiladas y clasificadas.",
              },
            ].map((kpi) => (
              <div
                key={kpi.title}
                className="flex items-start gap-3 rounded-xl border p-4"
                style={{
                  background: "var(--otto-surface)",
                  borderColor: "var(--otto-rule)",
                }}
              >
                <span
                  className="mt-1.5 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ background: kpi.color }}
                />
                <div>
                  <p
                    className="font-display m-0 text-[14px] font-semibold"
                    style={{ color: "var(--otto-ink)" }}
                  >
                    {kpi.title}
                  </p>
                  <p
                    className="m-0 mt-0.5 text-[13px] leading-[1.5]"
                    style={{ color: "var(--otto-muted)" }}
                  >
                    {kpi.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Subheading>Gráficos disponibles</Subheading>
          <BulletList>
            <li>
              <strong>Boletines por semana:</strong> tendencia de generación
              de boletines.
            </li>
            <li>
              <strong>Emails enviados vs abiertos:</strong> efectividad de las
              campañas de email.
            </li>
            <li>
              <strong>Noticias por categoría:</strong> distribución de
              noticias (Economía, Política, etc.).
            </li>
            <li>
              <strong>Artículos por fuente:</strong> volumen de noticias por
              cada fuente periodística.
            </li>
          </BulletList>
          <Subheading>Actividad reciente</Subheading>
          <Paragraph>
            En la sección inferior del Dashboard se muestra un registro de las
            acciones recientes: autorizaciones, publicaciones, envíos de email
            y eliminaciones con fecha, hora y usuario responsable.
          </Paragraph>

          {/* MENU NAVEGACION */}
          <SectionTitle id="navegacion" index={4} icon={ScrollText}>
            Menú de navegación
          </SectionTitle>
          <Paragraph>
            La barra lateral izquierda permite acceder a todos los módulos del
            sistema, agrupados por <strong>Operación</strong>,{" "}
            <strong>Audiencia</strong> y <strong>Configuración</strong>.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/19-menu-navegacion.png"
            alt="Menú de navegación"
            caption="Sidebar con todos los módulos del sistema"
          />
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
            {[
              { name: "Hoy", desc: "Dashboard del día y pipeline activo" },
              { name: "Boletines", desc: "Gestión de boletines diarios" },
              { name: "Generar", desc: "Crear un nuevo boletín" },
              { name: "Suscriptores", desc: "Gestión de lista de correos" },
              { name: "Fuentes", desc: "Configuración de fuentes" },
              { name: "Categorías", desc: "Categorías de clasificación" },
              { name: "Usuarios", desc: "Administración de usuarios" },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-lg border p-3"
                style={{
                  background: "var(--otto-surface)",
                  borderColor: "var(--otto-rule)",
                }}
              >
                <p
                  className="font-display m-0 text-[14px] font-semibold"
                  style={{ color: "var(--otto-ink)" }}
                >
                  {item.name}
                </p>
                <p
                  className="m-0 mt-0.5 text-[12px] leading-[1.4]"
                  style={{ color: "var(--otto-muted)" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
          <ImportantBox>
            El administrador puede configurar qué módulos ve cada usuario. Si
            no aparece alguno de estos elementos en su sidebar, contacte al
            administrador para solicitar acceso.
          </ImportantBox>

          {/* BOLETINES */}
          <SectionTitle id="boletines" index={5} icon={Newspaper}>
            Lista de boletines
          </SectionTitle>
          <Paragraph>
            La sección de Boletines muestra todos los boletines generados
            agrupados por semana (más recientes primero). Cada fila muestra el
            día, título, cantidad de noticias, tasa de apertura y estado del
            envío.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/04-boletines-lista.png"
            alt="Lista de boletines"
            caption="Vista general de todos los boletines generados"
          />
          <Subheading>Estados de un boletín</Subheading>
          <div className="space-y-2">
            {[
              {
                status: "Borrador",
                variant: "muted" as const,
                desc: "Recién creado, en proceso de recopilación",
              },
              {
                status: "Listo",
                variant: "info" as const,
                desc: "Noticias clasificadas y resúmenes generados",
              },
              {
                status: "Autorizado",
                variant: "ok" as const,
                desc: "Aprobado por un administrador",
              },
              {
                status: "Publicado",
                variant: "okStrong" as const,
                desc: "Disponible públicamente y enviado",
              },
              {
                status: "Fallido",
                variant: "err" as const,
                desc: "Error durante la generación",
              },
            ].map((item) => (
              <div
                key={item.status}
                className="flex items-center gap-3 rounded-lg border px-4 py-2.5"
                style={{
                  background: "var(--otto-surface)",
                  borderColor: "var(--otto-rule)",
                }}
              >
                <StatusPill label={item.status} variant={item.variant} />
                <span
                  className="text-[13px]"
                  style={{ color: "var(--otto-ink-2)" }}
                >
                  {item.desc}
                </span>
              </div>
            ))}
          </div>

          {/* GENERAR */}
          <SectionTitle id="generar" index={6} icon={Plus}>
            Generar nuevo boletín
          </SectionTitle>
          <Paragraph>
            Para generar un nuevo boletín diario, haga clic en{" "}
            <strong>&quot;Generar boletín&quot;</strong> desde el menú lateral
            o desde la lista de boletines.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/05-generar-boletin.png"
            alt="Generar boletín"
            caption="Pantalla de generación de un nuevo boletín"
          />
          <NoteBox>
            Solo se puede generar un boletín por día. Si ya existe un boletín
            para la fecha actual, el botón estará deshabilitado.
          </NoteBox>
          <Subheading>Proceso de generación (Pipeline)</Subheading>
          <StepBox number={1}>
            <strong>Recopilación (Scraping):</strong> el sistema visita
            automáticamente las fuentes configuradas y extrae las noticias del
            día.
          </StepBox>
          <StepBox number={2}>
            <strong>Clasificación (IA):</strong> la inteligencia artificial
            analiza cada noticia y la asigna a una categoría.
          </StepBox>
          <StepBox number={3}>
            <strong>Resumen (IA):</strong> se generan resúmenes concisos de las
            noticias más relevantes de cada categoría.
          </StepBox>
          <ImportantBox>
            El proceso completo toma entre 3 y 8 minutos dependiendo de la
            cantidad de noticias. No cierre la ventana durante la generación.
          </ImportantBox>

          {/* DETALLE */}
          <SectionTitle id="detalle" index={7} icon={FileText}>
            Detalle del boletín
          </SectionTitle>
          <Paragraph>
            Al hacer clic en un boletín de la lista, accede a su vista
            detallada. Aquí puede ver los resúmenes, las noticias originales,
            editar contenido, revisar la auditoría y gestionar la
            publicación.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/06-boletin-detalle.png"
            alt="Detalle del boletín"
            caption="Vista de detalle de un boletín con tabs y botones de acción"
          />
          <Subheading>Botones de acción</Subheading>
          <div className="space-y-2">
            {[
              {
                btn: "Reactivar boletín",
                desc: "Permite regenerar el procesamiento del boletín",
              },
              {
                btn: "Enviar prueba",
                desc: "Envía un email de prueba al administrador antes del envío masivo",
              },
              {
                btn: "Compartir link público",
                desc: "Genera un enlace público para compartir el boletín (solo si está autorizado/publicado)",
              },
              {
                btn: "Eliminar",
                desc: "Elimina el boletín permanentemente (con confirmación)",
              },
            ].map((item) => (
              <div
                key={item.btn}
                className="flex items-start gap-3 rounded-lg border p-3"
                style={{
                  background: "var(--otto-surface)",
                  borderColor: "var(--otto-rule)",
                }}
              >
                <Code>{item.btn}</Code>
                <span
                  className="flex-1 text-[13px] leading-[1.5]"
                  style={{ color: "var(--otto-muted)" }}
                >
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
          <Subheading>Tab: Resúmenes</Subheading>
          <Paragraph>
            Muestra el boletín con los resúmenes generados por IA. Puede
            alternar entre dos diseños:{" "}
            <strong>Clásico</strong> (formato tradicional editorial) y{" "}
            <strong>Moderno</strong> (tarjetas con jerarquía visual).
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/07-tab-resumenes.png"
            alt="Tab resúmenes"
            caption="Tab de resúmenes con selector de diseño Clásico/Moderno"
          />

          {/* TAB NOTICIAS */}
          <SectionTitle id="noticias" index={8} icon={Rss}>
            Tab Noticias
          </SectionTitle>
          <Paragraph>
            Esta pestaña muestra todas las noticias recopiladas, organizadas
            por fuente. Cada noticia tiene un checkbox que indica si fue
            seleccionada para el boletín. Puede ver el total de noticias, las
            seleccionadas y las fuentes consultadas.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/08-tab-noticias.png"
            alt="Tab noticias"
            caption="Noticias organizadas por fuente con contadores y checkboxes"
          />
          <Paragraph>
            Las fuentes se muestran como pestañas secundarias:{" "}
            <strong>La Hora, Primicias, El Comercio, Teleamazonas, ECU911</strong>
            . Haga clic en cada fuente para ver sus noticias. Cada noticia
            incluye título, descripción, fecha y un enlace{" "}
            <strong>&quot;Ver original&quot;</strong> para abrir la noticia en
            su fuente.
          </Paragraph>

          {/* TAB EDITAR */}
          <SectionTitle id="editar" index={9} icon={Settings}>
            Tab Editar
          </SectionTitle>
          <Paragraph>
            En esta pestaña puede editar los resúmenes generados por la IA,
            agregar noticias manualmente, reordenar con drag &amp; drop y
            modificar el contenido antes de autorizar el boletín. Los cambios
            se guardan automáticamente.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/09-tab-editar.png"
            alt="Tab editar"
            caption="Interfaz de edición del boletín con campos editables por categoría"
          />
          <Subheading>Agregar noticias manualmente</Subheading>
          <Paragraph>
            Si desea agregar una noticia que no fue recopilada
            automáticamente, use el formulario de{" "}
            <strong>&quot;Agregar noticia manual&quot;</strong>. Complete el
            título, resumen, URL de la fuente y seleccione la categoría
            correspondiente.
          </Paragraph>

          {/* TAB AUDITORIA */}
          <SectionTitle id="auditoria" index={10} icon={Shield}>
            Tab Auditoría
          </SectionTitle>
          <Paragraph>
            El registro de auditoría muestra un historial cronológico de todas
            las acciones realizadas sobre el boletín: quién lo autorizó, quién
            lo publicó, cuándo se envió el email y cualquier eliminación.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/10-tab-auditoria.png"
            alt="Tab auditoría"
            caption="Registro de auditoría mostrando acciones, usuarios y fechas"
          />
          <Paragraph>Cada entrada muestra:</Paragraph>
          <BulletList>
            <li>
              <strong>Tipo de acción:</strong> Autorizado, Publicado, Email
              enviado, Eliminado.
            </li>
            <li>
              <strong>Usuario:</strong> nombre y correo del responsable.
            </li>
            <li>
              <strong>Fecha y hora:</strong> momento exacto de la acción.
            </li>
          </BulletList>

          {/* PUBLICAR */}
          <SectionTitle id="publicar" index={11} icon={Send}>
            Autorizar y publicar
          </SectionTitle>
          <Paragraph>
            El flujo de publicación de un boletín sigue cinco etapas
            secuenciales:
          </Paragraph>
          <div
            className="my-6 flex flex-wrap items-center gap-3 rounded-xl border p-5"
            style={{
              background: "var(--otto-surface)",
              borderColor: "var(--otto-rule)",
            }}
          >
            {["Borrador", "Listo", "Autorizado", "Publicado", "Email enviado"].map(
              (step, i) => {
                const variants: Array<
                  "muted" | "info" | "ok" | "okStrong"
                > = ["muted", "muted", "info", "ok", "okStrong"];
                return (
                  <div key={step} className="flex items-center gap-3">
                    <StatusPill label={step} variant={variants[i]} />
                    {i < 4 ? (
                      <span
                        className="font-mono-otto"
                        style={{ color: "var(--otto-muted)" }}
                      >
                        →
                      </span>
                    ) : null}
                  </div>
                );
              },
            )}
          </div>
          <StepBox number={1}>
            <strong>Autorizar:</strong> revise el contenido en la tab
            &quot;Resúmenes&quot;. Si todo está correcto, haga clic en{" "}
            <strong>&quot;Autorizar&quot;</strong>. Esto registra en la
            auditoría quién aprobó el boletín.
          </StepBox>
          <StepBox number={2}>
            <strong>Publicar:</strong> una vez autorizado, haga clic en{" "}
            <strong>&quot;Publicar&quot;</strong>. Esto genera el enlace
            público del boletín.
          </StepBox>
          <StepBox number={3}>
            <strong>Enviar prueba:</strong> antes del envío masivo, haga clic
            en <strong>&quot;Enviar prueba&quot;</strong> para verificar cómo
            se ve el correo.
          </StepBox>
          <StepBox number={4}>
            <strong>Enviar a suscriptores:</strong> finalmente, envíe el
            boletín a todos los suscriptores registrados. El sistema rastrea
            las aperturas y los clicks.
          </StepBox>
          <NoteBox>
            Una vez enviado el email a suscriptores, el boletín no se puede
            eliminar para mantener la integridad del registro de auditoría.
          </NoteBox>

          {/* VISTA PUBLICA */}
          <SectionTitle id="vista-publica" index={12} icon={Eye}>
            Vista pública del boletín
          </SectionTitle>
          <Paragraph>
            Los boletines publicados tienen una vista pública accesible sin
            necesidad de iniciar sesión. Esta vista organiza el contenido en
            tres columnas: video (izquierda), noticias por categoría (centro)
            y última hora (derecha).
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/17-vista-publica.png"
            alt="Vista pública"
            caption="Vista pública del boletín con layout de 3 columnas"
          />
          <Paragraph>
            Para compartir un boletín, use el botón{" "}
            <strong>&quot;Compartir link público&quot;</strong> en la vista
            de detalle. El enlace se copiará al portapapeles y podrá
            distribuirlo por cualquier medio.
          </Paragraph>

          {/* FUENTES */}
          <SectionTitle id="fuentes" index={13} icon={Rss}>
            Configuración de fuentes
          </SectionTitle>
          <Paragraph>
            En la sección de <strong>Fuentes</strong> se configuran los sitios
            web de donde el sistema recopila noticias automáticamente. Las
            fuentes actuales incluyen los principales medios ecuatorianos.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/13-fuentes.png"
            alt="Fuentes de noticias"
            caption="Configuración de fuentes de noticias del sistema"
          />
          <ImportantBox>
            La configuración de fuentes es una tarea avanzada. Solo modifique
            estos valores si sabe lo que está haciendo o bajo instrucciones
            del equipo técnico.
          </ImportantBox>

          {/* SUSCRIPTORES */}
          <SectionTitle id="suscriptores" index={14} icon={Users}>
            Gestión de suscriptores
          </SectionTitle>
          <Paragraph>
            La sección de Suscriptores permite gestionar la lista de correos
            electrónicos que reciben los boletines. Puede agregar, editar y
            eliminar suscriptores individualmente o importarlos masivamente
            desde un archivo CSV.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/14-suscriptores.png"
            alt="Suscriptores"
            caption="Gestión de suscriptores de email"
          />
          <Subheading>Funciones disponibles</Subheading>
          <BulletList>
            <li>
              <strong>Agregar suscriptor:</strong> ingrese nombre y correo
              electrónico.
            </li>
            <li>
              <strong>Importar CSV:</strong> cargue un archivo CSV con
              columnas <Code>name</Code> y <Code>email</Code>.
            </li>
            <li>
              <strong>Exportar:</strong> descargue la lista completa en
              formato CSV.
            </li>
            <li>
              <strong>Eliminar:</strong> remueva suscriptores individuales o
              en lote.
            </li>
          </BulletList>
          <ImportantBox>
            Los suscriptores pueden darse de baja automáticamente a través del
            enlace incluido en cada correo electrónico.
          </ImportantBox>

          {/* CATEGORIAS */}
          <SectionTitle id="categorias" index={15} icon={Tag}>
            Gestión de categorías
          </SectionTitle>
          <Paragraph>
            Las categorías determinan cómo se clasifican las noticias. Puede
            crear nuevas categorías, editar las existentes y reordenarlas
            arrastrando las tarjetas en el grid.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/15-categorias.png"
            alt="Categorías"
            caption="Gestión de categorías de noticias"
          />
          <Paragraph>
            Las categorías predeterminadas son:{" "}
            <strong>
              Economía, Política, Sociedad, Seguridad, Internacional y Vial
            </strong>
            . La IA utilizará estas categorías para clasificar
            automáticamente las noticias recopiladas.
          </Paragraph>

          {/* USUARIOS */}
          <SectionTitle id="usuarios" index={16} icon={Users}>
            Administración de usuarios
          </SectionTitle>
          <Paragraph>
            La sección de Usuarios permite al administrador gestionar las
            cuentas de acceso al sistema. Puede crear nuevos usuarios, cambiar
            contraseñas, activar/desactivar cuentas y asignar permisos por
            rol (Admin, Editor, Viewer).
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/16-usuarios.png"
            alt="Usuarios"
            caption="Panel de administración de usuarios"
          />
          <Subheading>Funciones de administración</Subheading>
          <BulletList>
            <li>
              <strong>Crear usuario:</strong> defina nombre, email y
              contraseña para un nuevo usuario.
            </li>
            <li>
              <strong>Cambiar contraseña:</strong> restablezca la contraseña
              de cualquier usuario.
            </li>
            <li>
              <strong>Activar/Desactivar:</strong> las cuentas desactivadas no
              pueden iniciar sesión.
            </li>
            <li>
              <strong>Permisos por rol:</strong> Admin (control total), Editor
              (gestión editorial), Viewer (solo lectura).
            </li>
          </BulletList>
          <NoteBox>
            Los cambios en permisos se aplican inmediatamente. El usuario
            afectado verá los cambios la próxima vez que cargue la página.
          </NoteBox>

          {/* EMAIL */}
          <SectionTitle id="email" index={17} icon={Mail}>
            Envío de correos electrónicos
          </SectionTitle>
          <Paragraph>
            El sistema envía boletines por correo electrónico a todos los
            suscriptores registrados. Los correos incluyen el contenido
            completo del boletín con un diseño editorial profesional.
          </Paragraph>
          <Subheading>Proceso de envío</Subheading>
          <StepBox number={1}>
            Asegúrese de que el boletín esté en estado{" "}
            <strong>Autorizado</strong> o <strong>Publicado</strong>.
          </StepBox>
          <StepBox number={2}>
            Haga clic en <strong>&quot;Enviar prueba&quot;</strong> para
            recibir un email de prueba en su correo y verificar el contenido.
          </StepBox>
          <StepBox number={3}>
            Si la prueba se ve bien, haga clic en{" "}
            <strong>&quot;Enviar a suscriptores&quot;</strong> para distribuir
            el boletín a toda la lista.
          </StepBox>
          <Subheading>Seguimiento de emails</Subheading>
          <Paragraph>El sistema rastrea automáticamente:</Paragraph>
          <BulletList>
            <li>
              <strong>Aperturas:</strong> cuántos destinatarios abrieron el
              email.
            </li>
            <li>
              <strong>Clicks:</strong> cuántos hicieron clic en los enlaces de
              noticias.
            </li>
          </BulletList>
          <Paragraph>
            Estos datos alimentan los KPIs del Dashboard ejecutivo
            (&quot;Tasa de apertura&quot;, &quot;Emails enviados vs
            abiertos&quot;).
          </Paragraph>

          {/* VIDEO */}
          <SectionTitle id="video" index={18} icon={Video}>
            Video tutorial
          </SectionTitle>
          <Paragraph>
            A continuación puede ver un video tutorial que demuestra el uso
            completo del sistema OttoSeguridad de inicio a fin:
          </Paragraph>
          <div
            className="overflow-hidden rounded-xl border"
            style={{
              borderColor: "var(--otto-rule)",
              background: "var(--otto-ink)",
              boxShadow: "var(--otto-shadow-2)",
            }}
          >
            <video
              controls
              className="w-full"
              poster="/manual/screenshots/03-dashboard.png"
              preload="metadata"
            >
              <source src="/manual/video-tutorial.mp4" type="video/mp4" />
              Su navegador no soporta la reproducción de video.
            </video>
          </div>
          <p
            className="font-mono-otto mt-3 text-center"
            style={{ color: "var(--otto-muted)" }}
          >
            Video tutorial · OttoSeguridad
          </p>

          {/* FOOTER */}
          <div
            className="mt-16 rounded-2xl border p-8 text-center"
            style={{
              background: "var(--otto-surface)",
              borderColor: "var(--otto-rule)",
            }}
          >
            <BookOpen
              className="mx-auto h-8 w-8"
              style={{ color: "var(--otto-primary)" }}
            />
            <p
              className="font-display mt-3 text-[16px] font-bold"
              style={{ color: "var(--otto-ink)" }}
            >
              Manual de usuario · OttoSeguridad
            </p>
            <p
              className="font-mono-otto mt-2"
              style={{ color: "var(--otto-muted)" }}
            >
              Versión 1.0 · Última actualización abril 2026
            </p>
            <p
              className="m-0 mt-3 text-[13px]"
              style={{ color: "var(--otto-muted)" }}
            >
              Para soporte técnico, contacte al administrador del sistema.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
