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
  { id: "navegacion", label: "Consola y sidebar", icon: ScrollText },
  { id: "dashboard", label: "Hoy · Dashboard", icon: LayoutDashboard },
  { id: "boletines", label: "Lista de boletines", icon: Newspaper },
  { id: "generar", label: "Generar nuevo boletín", icon: Plus },
  { id: "detalle", label: "Detalle del boletín", icon: FileText },
  { id: "resumenes", label: "Tab Resúmenes", icon: BookOpen },
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
        lede="Guía completa de la consola editorial: del primer login al envío masivo, configuración de fuentes y administración del equipo."
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
                Versión 1.1 · Abr 2026
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
            es una consola editorial para la generación automatizada de
            boletines de noticias de Ecuador. El sistema recopila titulares de
            cinco medios nacionales, los clasifica con inteligencia artificial,
            redacta resúmenes y los distribuye por correo electrónico a la
            audiencia registrada.
          </Paragraph>
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              {
                title: "Recopilación automática",
                desc: "El Comercio, Primicias, La Hora, Teleamazonas y ECU911",
              },
              {
                title: "Clasificación con IA",
                desc: "Categorización automática en 7 etiquetas: Última Hora, Economía, Política, Sociedad, Seguridad, Internacional y Vial",
              },
              {
                title: "Distribución por email",
                desc: "Envío masivo con seguimiento de apertura y engagement por suscriptor",
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
            <Code>app.ottoseguridadai.com</Code> y utilice las credenciales
            entregadas por el administrador.
          </Paragraph>
          <StepBox number={1}>
            Abra el navegador y vaya a la URL del sistema. Aparecerá la
            pantalla de inicio de sesión con el logotipo de OttoSeguridad.
          </StepBox>
          <ScreenshotImg
            src="/manual/screenshots/01-login.png"
            alt="Pantalla de inicio de sesión"
            caption="Pantalla de inicio de sesión de OttoSeguridad"
          />
          <StepBox number={2}>
            Ingrese su <strong>correo electrónico</strong> en el campo Email
            y su <strong>contraseña</strong> en el campo Contraseña.
          </StepBox>
          <ScreenshotImg
            src="/manual/screenshots/02-login-filled.png"
            alt="Login con credenciales"
            caption="Ingreso de credenciales de acceso"
          />
          <StepBox number={3}>
            Haga clic en el botón rojo <strong>Iniciar Sesión</strong>. Será
            redirigido a la consola en la pantalla <Code>Hoy</Code>.
          </StepBox>
          <ImportantBox>
            Si su cuenta ha sido desactivada por el administrador recibirá un
            mensaje de error. Contacte al administrador para reactivarla.
          </ImportantBox>

          {/* NAVEGACION */}
          <SectionTitle id="navegacion" index={3} icon={ScrollText}>
            Consola y sidebar
          </SectionTitle>
          <Paragraph>
            La consola usa un <strong>sidebar oscuro a la izquierda</strong>{" "}
            con tres grupos de navegación: <strong>Operación</strong>,{" "}
            <strong>Audiencia</strong> y <strong>Configuración</strong>. En
            la parte inferior hay un indicador en vivo del estado del
            pipeline (por ejemplo &quot;Pipeline activo · Renderizando
            video&quot;).
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/19-menu-navegacion.png"
            alt="Sidebar de navegación"
            caption="Sidebar oscuro con los módulos de la consola"
          />
          <Subheading>Módulos disponibles</Subheading>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
            {[
              { name: "Hoy", desc: "Dashboard del día con KPIs y pipeline" },
              { name: "Boletines", desc: "Histórico agrupado por semana" },
              { name: "Generar", desc: "Crear el boletín del día" },
              { name: "Suscriptores", desc: "Audiencia y engagement" },
              { name: "Fuentes", desc: "Sitios monitoreados" },
              { name: "Categorías", desc: "Etiquetas del clasificador" },
              { name: "Usuarios", desc: "Permisos del equipo" },
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
          <Paragraph>
            En la cabecera superior derecha encontrará el{" "}
            <strong>buscador global</strong> (atajo <Code>⌘K</Code>) para
            buscar boletines o fuentes y un <strong>avatar circular</strong>{" "}
            con sus iniciales que despliega el menú de perfil y cierre de
            sesión.
          </Paragraph>

          {/* DASHBOARD */}
          <SectionTitle id="dashboard" index={4} icon={LayoutDashboard}>
            Hoy · Dashboard ejecutivo
          </SectionTitle>
          <Paragraph>
            La pantalla <Code>Hoy</Code> es la primera vista al iniciar
            sesión. Muestra un saludo personalizado y resume el estado del
            boletín del día, los indicadores de los últimos 7 días y los
            próximos pasos pendientes.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/03-dashboard.png"
            alt="Dashboard ejecutivo Hoy"
            caption="Vista Hoy con hero card del boletín, KPIs y actividad"
          />
          <Subheading>Hero card del boletín</Subheading>
          <Paragraph>
            La tarjeta oscura central muestra el estado del boletín que se
            envía a las <strong>06:00</strong>: cantidad de noticias, número
            de categorías, destinatarios y un{" "}
            <strong>visualizador del pipeline</strong> con cinco etapas:{" "}
            <Code>Scraping</Code> → <Code>Clasif.</Code> →{" "}
            <Code>Resumen</Code> → <Code>Video</Code> → <Code>Enviar</Code>.
            Los botones <strong>Autorizar y enviar →</strong> y{" "}
            <strong>Previsualizar</strong> permiten actuar en un clic.
          </Paragraph>
          <Subheading>Indicadores KPI (últimos 7 días)</Subheading>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              {
                color: "var(--otto-primary)",
                title: "Apertura · último envío",
                desc: "Porcentaje de aperturas del boletín más reciente y total de envíos.",
              },
              {
                color: "var(--otto-ok)",
                title: "Suscriptores netos · 7D",
                desc: "Variación neta de suscriptores en la última semana.",
              },
              {
                color: "var(--otto-warn)",
                title: "Boletines · 7D",
                desc: "Cuántos boletines se publicaron en los últimos 7 días.",
              },
              {
                color: "var(--otto-ink)",
                title: "Pipeline · prom.",
                desc: "Tiempo promedio que tarda el pipeline en completar.",
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
          <Subheading>Últimos boletines y próximos pasos</Subheading>
          <Paragraph>
            En la parte inferior se listan los <strong>últimos boletines</strong>{" "}
            (con fecha, título, número de noticias y estado:{" "}
            <Code>EN PIPELINE</Code> / <Code>ENVIADO</Code>) y un panel de{" "}
            <strong>Próximos pasos</strong> que indica las acciones
            pendientes (revisar boletín, revisar auditoría, etc.).
          </Paragraph>

          {/* BOLETINES */}
          <SectionTitle id="boletines" index={5} icon={Newspaper}>
            Lista de boletines
          </SectionTitle>
          <Paragraph>
            La sección <Code>Boletines</Code> muestra el histórico completo,
            agrupado por semana (más reciente primero). En la parte superior
            encontrará pestañas de filtro <strong>Todos</strong>,{" "}
            <strong>Enviados</strong>, <strong>Borradores</strong> y{" "}
            <strong>Errores</strong>, además de un selector de mes y un botón{" "}
            <strong>Exportar</strong>.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/04-boletines-lista.png"
            alt="Lista de boletines"
            caption="Histórico de boletines agrupado por semana, con filtros y exportación"
          />
          <Paragraph>
            Cada fila muestra el día, el título destacado del boletín, número
            de noticias, número de categorías y un <strong>pill</strong> con
            el estado. Para los boletines enviados se muestra además la{" "}
            <strong>tasa de apertura</strong> y el número de lecturas. Al
            hacer clic en una fila se abre el detalle.
          </Paragraph>
          <Subheading>Estados de un boletín</Subheading>
          <div className="space-y-2">
            {[
              {
                status: "Scraped",
                variant: "muted" as const,
                desc: "Noticias recopiladas, pendiente de clasificación",
              },
              {
                status: "En pipeline",
                variant: "info" as const,
                desc: "Procesamiento en curso (clasificación, resumen, video)",
              },
              {
                status: "Listo",
                variant: "info" as const,
                desc: "Resúmenes generados, listo para autorizar",
              },
              {
                status: "Autorizado",
                variant: "ok" as const,
                desc: "Aprobado por un administrador",
              },
              {
                status: "Publicado",
                variant: "okStrong" as const,
                desc: "Disponible públicamente y enviado por email",
              },
              {
                status: "Enviado",
                variant: "okStrong" as const,
                desc: "Email distribuido a la lista de suscriptores",
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
            Para crear el boletín del día haga clic en{" "}
            <strong>Generar</strong> en el sidebar. Si todavía no existe un
            boletín para la fecha actual el sistema lanza el pipeline
            automáticamente; si ya existe, le redirige al detalle del boletín
            de hoy.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/05-generar-boletin.png"
            alt="Pantalla de boletín del día"
            caption="Cuando ya existe boletín de hoy, el botón Generar abre directamente su detalle"
          />
          <NoteBox>
            Solo se puede generar <strong>un boletín por día</strong>. Si ya
            existe, la lista de boletines mostrará un banner rojo:{" "}
            <em>&quot;Boletín de hoy ya existe. Solo puedes generar uno por
            día. Ver boletín →&quot;</em>.
          </NoteBox>
          <Subheading>Etapas del pipeline</Subheading>
          <StepBox number={1}>
            <strong>Scraping:</strong> el sistema visita las cinco fuentes
            configuradas y descarga los artículos publicados.
          </StepBox>
          <StepBox number={2}>
            <strong>Clasificación (IA):</strong> cada noticia se asigna
            automáticamente a una de las 7 categorías.
          </StepBox>
          <StepBox number={3}>
            <strong>Resumen (IA):</strong> se redactan los resúmenes
            editoriales por sección.
          </StepBox>
          <StepBox number={4}>
            <strong>Video:</strong> se renderiza un video con las imágenes y
            titulares destacados (visible en la columna izquierda del
            boletín público).
          </StepBox>
          <StepBox number={5}>
            <strong>Enviar:</strong> al autorizar y publicar, el boletín se
            distribuye a la lista de suscriptores.
          </StepBox>
          <ImportantBox>
            El pipeline completo toma entre 3 y 8 minutos según el volumen de
            noticias. Puede cerrar la ventana sin problema; el proceso
            continúa en segundo plano.
          </ImportantBox>

          {/* DETALLE */}
          <SectionTitle id="detalle" index={7} icon={FileText}>
            Detalle del boletín
          </SectionTitle>
          <Paragraph>
            Al abrir un boletín verá su <strong>fecha</strong> como título y
            su <strong>ID</strong> en gris debajo. A la derecha aparece un
            pill con el estado actual (<Code>Listo</Code>,{" "}
            <Code>Publicado</Code>, etc.). Debajo hay una barra blanca con
            los <strong>botones de acción</strong> y, finalmente, las cuatro
            pestañas del boletín.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/06-boletin-detalle.png"
            alt="Detalle del boletín"
            caption="Vista de detalle: título, ID, acciones y tabs"
          />
          <Subheading>Botones de acción según el estado</Subheading>
          <Paragraph>
            <strong>Boletín en estado &quot;Listo&quot;</strong> (sin
            autorizar):
          </Paragraph>
          <div className="space-y-2">
            {[
              {
                btn: "Autorizar",
                desc: "Marca el boletín como aprobado y registra al usuario en la auditoría",
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
          <Paragraph>
            <strong>Boletín en estado &quot;Publicado&quot;</strong> (ya
            enviado):
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/12-botones-accion.png"
            alt="Botones de acción de un boletín publicado"
            caption="Acciones disponibles para un boletín ya publicado y enviado"
          />
          <div className="space-y-2">
            {[
              {
                btn: "Reactivar Boletín",
                desc: "Reabre el boletín para edición (revierte la autorización)",
              },
              {
                btn: "Enviar Prueba",
                desc: "Envía un email de prueba al administrador antes del envío masivo",
              },
              {
                btn: "Compartir Link Público",
                desc: "Copia el enlace público (de la forma /bulletin/15-abr-2026) al portapapeles",
              },
              {
                btn: "No se puede eliminar",
                desc: "Los boletines enviados no pueden borrarse para preservar el registro de auditoría",
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
          <Subheading>Pestañas del boletín</Subheading>
          <Paragraph>
            Cada boletín tiene exactamente cuatro pestañas:{" "}
            <strong>Resúmenes</strong>, <strong>Noticias</strong>,{" "}
            <strong>Editar</strong> y <strong>Auditoría</strong>. Las
            siguientes secciones describen cada una en detalle.
          </Paragraph>

          {/* TAB RESUMENES */}
          <SectionTitle id="resumenes" index={8} icon={BookOpen}>
            Tab Resúmenes
          </SectionTitle>
          <Paragraph>
            Esta es la pestaña por defecto. Muestra el boletín completo con
            los resúmenes generados por IA, tal y como lo verán los
            destinatarios. Arriba hay un selector de{" "}
            <strong>Estilo de visualización</strong> con dos opciones:{" "}
            <strong>Diseño Clásico</strong> (formato editorial tradicional)
            y <strong>Diseño Moderno</strong> (tarjetas con jerarquía
            visual).
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/07-tab-resumenes.png"
            alt="Tab resúmenes"
            caption="Tab Resúmenes con selector de diseño Clásico/Moderno"
          />

          {/* TAB NOTICIAS */}
          <SectionTitle id="noticias" index={9} icon={Rss}>
            Tab Noticias
          </SectionTitle>
          <Paragraph>
            La pestaña <Code>Noticias</Code> muestra todas las noticias
            recopiladas, organizadas por <strong>fuente</strong>. En la parte
            superior hay un resumen con tres métricas:{" "}
            <strong>Total</strong> (noticias recopiladas),{" "}
            <strong>Seleccionadas</strong> (las que entrarán al boletín en
            verde) y <strong>Fuentes</strong> consultadas.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/08-tab-noticias.png"
            alt="Tab noticias"
            caption="Noticias agrupadas por fuente con contadores y selección por checkbox"
          />
          <Paragraph>
            Las fuentes aparecen como <strong>pestañas secundarias</strong>{" "}
            en negro con su contador (por ejemplo{" "}
            <Code>La Hora 6/20</Code>). Cada noticia incluye imagen,
            titular, descripción, fecha, etiqueta de categoría y un enlace{" "}
            <strong>Ver original</strong> que abre la noticia en su sitio
            fuente.
          </Paragraph>
          <Subheading>Acciones de selección</Subheading>
          <BulletList>
            <li>
              <strong>Checkbox individual</strong> en cada noticia para
              incluirla o excluirla del boletín.
            </li>
            <li>
              <strong>Seleccionar todas</strong> /{" "}
              <strong>Deseleccionar todas</strong> por fuente.
            </li>
            <li>
              <strong>Guardar</strong> guarda los cambios en la selección.
            </li>
            <li>
              <strong>Guardar y generar boletín</strong> guarda y vuelve a
              ejecutar el resumidor con la nueva selección.
            </li>
          </BulletList>

          {/* TAB EDITAR */}
          <SectionTitle id="editar" index={10} icon={Settings}>
            Tab Editar
          </SectionTitle>
          <Paragraph>
            La pestaña <Code>Editar</Code> activa el <strong>Modo
            Edición</strong> y permite ajustar manualmente el contenido del
            boletín antes de autorizarlo: editar resúmenes, agregar noticias
            manuales y administrar el video del boletín.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/09-tab-editar.png"
            alt="Tab editar"
            caption="Modo Edición con video del boletín y herramientas de IA"
          />
          <Subheading>Herramientas disponibles</Subheading>
          <BulletList>
            <li>
              <strong>+ Agregar manual</strong>: agrega una noticia que no
              fue recopilada por scraping (título, resumen, URL y categoría).
            </li>
            <li>
              <strong>Mejorar todo con IA</strong>: vuelve a ejecutar el
              resumidor sobre todo el boletín para refinar la redacción.
            </li>
            <li>
              <strong>Video del boletín</strong>: suba un MP4 (máximo
              150&nbsp;MB) que se mostrará en la columna izquierda del
              boletín público. También puede eliminarlo.
            </li>
          </BulletList>

          {/* TAB AUDITORIA */}
          <SectionTitle id="auditoria" index={11} icon={Shield}>
            Tab Auditoría
          </SectionTitle>
          <Paragraph>
            El <strong>Registro de Auditoría</strong> guarda un historial
            cronológico de todas las acciones críticas sobre el boletín:
            quién lo autorizó, quién lo publicó, cuándo se envió el email y
            cualquier intento de eliminación.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/11b-tab-auditoria.png"
            alt="Tab auditoría con eventos"
            caption="Registro de auditoría: AUTORIZADO, PUBLICADO y EMAIL_SENT con usuario y fecha"
          />
          <Paragraph>Cada entrada del registro muestra:</Paragraph>
          <BulletList>
            <li>
              <strong>Tipo de evento</strong> en pill rojo:{" "}
              <Code>AUTORIZADO</Code>, <Code>PUBLICADO</Code>,{" "}
              <Code>EMAIL_SENT</Code> o <Code>ELIMINADO</Code>.
            </li>
            <li>
              <strong>Usuario responsable</strong>: nombre y correo.
            </li>
            <li>
              <strong>Timestamp</strong>: fecha y hora exactas (formato 24h
              en zona horaria de Ecuador).
            </li>
          </BulletList>
          <ImportantBox>
            Los registros de auditoría son <strong>inmutables</strong>: no
            pueden editarse ni borrarse. Esto garantiza la trazabilidad
            editorial.
          </ImportantBox>

          {/* PUBLICAR */}
          <SectionTitle id="publicar" index={12} icon={Send}>
            Autorizar y publicar
          </SectionTitle>
          <Paragraph>
            El flujo de publicación de un boletín sigue cinco etapas:
          </Paragraph>
          <div
            className="my-6 flex flex-wrap items-center gap-3 rounded-xl border p-5"
            style={{
              background: "var(--otto-surface)",
              borderColor: "var(--otto-rule)",
            }}
          >
            {["Listo", "Autorizado", "Publicado", "Email enviado"].map(
              (step, i) => {
                const variants: Array<
                  "muted" | "info" | "ok" | "okStrong"
                > = ["info", "ok", "okStrong", "okStrong"];
                return (
                  <div key={step} className="flex items-center gap-3">
                    <StatusPill label={step} variant={variants[i]} />
                    {i < 3 ? (
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
            <strong>Revisar:</strong> abra el boletín y revise la pestaña{" "}
            <Code>Resúmenes</Code>. Si necesita ajustar contenido use{" "}
            <Code>Editar</Code>; si necesita cambiar la selección de
            noticias use <Code>Noticias</Code>.
          </StepBox>
          <StepBox number={2}>
            <strong>Autorizar:</strong> cuando todo esté correcto, haga clic
            en el botón naranja <strong>Autorizar</strong>. Se registra al
            usuario en la auditoría y aparecen los botones de envío.
          </StepBox>
          <StepBox number={3}>
            <strong>Enviar Prueba:</strong> envíe primero una prueba al
            administrador para verificar cómo se ve el correo en la bandeja
            de entrada.
          </StepBox>
          <StepBox number={4}>
            <strong>Publicar y enviar:</strong> esto genera el enlace
            público y distribuye el boletín a toda la lista de suscriptores.
            El sistema rastrea aperturas automáticamente.
          </StepBox>
          <NoteBox>
            Una vez enviado el email a los suscriptores el boletín{" "}
            <strong>no puede eliminarse</strong>. El botón aparece como{" "}
            <Code>No se puede eliminar</Code> para preservar el registro.
          </NoteBox>

          {/* VISTA PUBLICA */}
          <SectionTitle id="vista-publica" index={13} icon={Eye}>
            Vista pública del boletín
          </SectionTitle>
          <Paragraph>
            Los boletines publicados tienen una vista pública accesible sin
            iniciar sesión, en URLs amigables como{" "}
            <Code>/bulletin/15-abr-2026</Code>. El layout combina hero
            visual y tres columnas: <strong>VIDEO</strong> a la izquierda,
            <strong> noticias por categoría</strong> al centro (numeradas) y
            <strong> ÚLTIMA HORA</strong> a la derecha.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/17-vista-publica.png"
            alt="Vista pública del boletín"
            caption="Hero con título y fecha, video a la izquierda y noticias al centro"
          />
          <ScreenshotImg
            src="/manual/screenshots/17b-vista-publica-scroll.png"
            alt="Vista pública con scroll"
            caption="Las noticias muestran imagen, título destacado, resumen y enlace 'Leer más'"
          />
          <Paragraph>
            Para compartir un boletín use el botón{" "}
            <strong>Compartir Link Público</strong> en su detalle. El enlace
            se copia al portapapeles para distribuirlo por cualquier canal.
          </Paragraph>

          {/* FUENTES */}
          <SectionTitle id="fuentes" index={14} icon={Rss}>
            Configuración de fuentes
          </SectionTitle>
          <Paragraph>
            En <Code>Fuentes</Code> se configuran los sitios desde donde el
            sistema recopila noticias. La cabecera muestra cuatro KPIs:{" "}
            <strong>fuentes activas</strong>, <strong>total scraped</strong>
            , <strong>última corrida</strong> y{" "}
            <strong>errores 24h</strong>. Cada tarjeta de fuente tiene un
            toggle para activarla o desactivarla y un menú contextual para
            edición avanzada.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/13-fuentes.png"
            alt="Fuentes de noticias"
            caption="Cinco fuentes configuradas con KPIs de scraping en tiempo real"
          />
          <Paragraph>
            Las fuentes actuales son <strong>El Comercio</strong>,{" "}
            <strong>Primicias</strong>, <strong>La Hora</strong>,{" "}
            <strong>Teleamazonas</strong> y <strong>ECU911</strong>. Cada
            tarjeta muestra el dominio, el número de artículos, hace cuánto
            se ejecutó y el estado (<Code>success</Code> o error).
          </Paragraph>
          <ImportantBox>
            La configuración avanzada de fuentes (selectores CSS, headers,
            estrategia de scraping) es una tarea técnica. Solo modifíquela
            bajo instrucciones del equipo técnico.
          </ImportantBox>

          {/* SUSCRIPTORES */}
          <SectionTitle id="suscriptores" index={15} icon={Users}>
            Gestión de suscriptores
          </SectionTitle>
          <Paragraph>
            La sección <Code>Suscriptores</Code> centraliza la audiencia y
            su engagement. Arriba se muestran cuatro KPIs:{" "}
            <strong>total activos</strong>,{" "}
            <strong>engagement promedio</strong>,{" "}
            <strong>inactivos</strong> y{" "}
            <strong>total suscriptores</strong>.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/14-suscriptores.png"
            alt="Suscriptores"
            caption="Lista de suscriptores con segmento, engagement y última apertura"
          />
          <Subheading>Funciones disponibles</Subheading>
          <BulletList>
            <li>
              <strong>Pestañas de filtro</strong>: Todos, Activos,
              Recientes, Inactivos.
            </li>
            <li>
              <strong>Buscador</strong> por email o nombre.
            </li>
            <li>
              <strong>+ Nuevo</strong>: registra un suscriptor manualmente
              (nombre y correo).
            </li>
            <li>
              <strong>Importar CSV</strong>: carga masiva con columnas{" "}
              <Code>name</Code> y <Code>email</Code>.
            </li>
            <li>
              <strong>Exportar</strong>: descarga la lista completa en CSV.
            </li>
            <li>
              <strong>Menú contextual (···)</strong> en cada fila para
              editar o eliminar.
            </li>
          </BulletList>
          <Paragraph>
            Cada fila muestra el segmento del suscriptor (<Code>ENGAGED</Code>{" "}
            o <Code>INACTIVO</Code>), una barra de engagement con
            porcentaje, su última apertura y la fecha en que se suscribió.
          </Paragraph>
          <ImportantBox>
            Los suscriptores pueden darse de baja automáticamente desde el
            enlace incluido al pie de cada correo electrónico.
          </ImportantBox>

          {/* CATEGORIAS */}
          <SectionTitle id="categorias" index={16} icon={Tag}>
            Gestión de categorías
          </SectionTitle>
          <Paragraph>
            En <Code>Categorías</Code> se gestionan las etiquetas con las
            que el clasificador agrupa las noticias del boletín. La vista
            muestra tres KPIs (<strong>total</strong>,{" "}
            <strong>activas</strong>, <strong>keywords totales</strong>) y
            las categorías como <strong>tarjetas en grid</strong> con un
            color distintivo a la izquierda.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/15-categorias.png"
            alt="Categorías"
            caption="Las 7 categorías predeterminadas, cada una con su orden y estado"
          />
          <Paragraph>
            Las categorías predeterminadas son:{" "}
            <strong>
              Última Hora, Economía, Política, Sociedad, Seguridad,
              Internacional y Vial
            </strong>
            . Cada tarjeta muestra el nombre, etiqueta <Code>Default</Code>{" "}
            si es del sistema, descripción opcional, las{" "}
            <strong>keywords</strong> que ayudan al clasificador, el conteo
            de noticias 7D, su <strong>orden</strong> de aparición y el
            estado <Code>ACTIVA</Code>.
          </Paragraph>
          <Paragraph>
            Use <strong>+ Nueva categoría</strong> para crear etiquetas
            personalizadas. Las tarjetas pueden reordenarse arrastrándolas
            para definir el orden en que aparecen en el boletín público.
          </Paragraph>

          {/* USUARIOS */}
          <SectionTitle id="usuarios" index={17} icon={Users}>
            Administración de usuarios
          </SectionTitle>
          <Paragraph>
            La sección <Code>Usuarios y permisos</Code> gestiona el acceso
            del equipo a la consola. En la parte superior hay tres tarjetas
            con los <strong>roles disponibles</strong>, sus capacidades y
            cuántos usuarios tiene asignados cada uno.
          </Paragraph>
          <ScreenshotImg
            src="/manual/screenshots/16-usuarios.png"
            alt="Usuarios y permisos"
            caption="Roles ADMIN, EDITOR y VIEWER con detalle de permisos y lista del equipo"
          />
          <Subheading>Roles del sistema</Subheading>
          <div className="space-y-3">
            {[
              {
                role: "ADMIN",
                desc: "Acceso completo. Gestiona usuarios, fuentes y configuración. Puede generar y enviar boletines, gestionar suscriptores e invitar/eliminar usuarios.",
              },
              {
                role: "EDITOR",
                desc: "Genera boletines y administra la audiencia. Sin acceso a configuración (no configura fuentes/categorías ni invita usuarios).",
              },
              {
                role: "VIEWER",
                desc: "Solo lectura. Visualiza boletines, métricas y suscriptores sin modificar nada.",
              },
            ].map((r) => (
              <div
                key={r.role}
                className="flex items-start gap-3 rounded-lg border p-3"
                style={{
                  background: "var(--otto-surface)",
                  borderColor: "var(--otto-rule)",
                }}
              >
                <Code>{r.role}</Code>
                <span
                  className="flex-1 text-[13px] leading-[1.5]"
                  style={{ color: "var(--otto-muted)" }}
                >
                  {r.desc}
                </span>
              </div>
            ))}
          </div>
          <Subheading>Acciones disponibles</Subheading>
          <BulletList>
            <li>
              <strong>+ Invitar usuario</strong>: envía una invitación por
              email para crear una cuenta con el rol asignado.
            </li>
            <li>
              <strong>Tabla del equipo</strong>: muestra usuario, rol,
              estado (<Code>ACTIVO</Code> / <Code>INACTIVO</Code>) y fecha
              de alta.
            </li>
            <li>
              <strong>Menú contextual (···)</strong>: cambiar rol,
              activar/desactivar cuenta o eliminar usuario.
            </li>
          </BulletList>
          <NoteBox>
            Los cambios de rol se aplican inmediatamente. El usuario verá
            la nueva configuración la próxima vez que cargue la consola.
          </NoteBox>

          {/* EMAIL */}
          <SectionTitle id="email" index={18} icon={Mail}>
            Envío de correos electrónicos
          </SectionTitle>
          <Paragraph>
            El sistema envía los boletines por correo electrónico a los
            suscriptores activos. Los correos incluyen el boletín completo
            con un diseño editorial profesional y enlaces que rastrean
            aperturas y clicks.
          </Paragraph>
          <Subheading>Proceso de envío</Subheading>
          <StepBox number={1}>
            Asegúrese de que el boletín esté en estado{" "}
            <Code>Autorizado</Code> o <Code>Publicado</Code>.
          </StepBox>
          <StepBox number={2}>
            Haga clic en <strong>Enviar Prueba</strong> para recibir un
            email de prueba en su correo y verificar el contenido visual.
          </StepBox>
          <StepBox number={3}>
            Si la prueba se ve correctamente, complete el envío masivo
            desde el flujo de publicación.
          </StepBox>
          <Subheading>Seguimiento de emails</Subheading>
          <Paragraph>El sistema rastrea automáticamente:</Paragraph>
          <BulletList>
            <li>
              <strong>Aperturas</strong>: cuántos destinatarios abrieron el
              email (alimenta el KPI &quot;Apertura · último envío&quot; en
              Hoy).
            </li>
            <li>
              <strong>Clicks</strong>: cuántos hicieron clic en cada enlace
              de noticia.
            </li>
            <li>
              <strong>Engagement por suscriptor</strong>: visible en la
              sección Suscriptores como porcentaje y barra de progreso.
            </li>
          </BulletList>

          {/* VIDEO */}
          <SectionTitle id="video" index={19} icon={Video}>
            Video tutorial
          </SectionTitle>
          <Paragraph>
            A continuación puede ver un video tutorial con el recorrido
            completo por la consola OttoSeguridad:
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
              Versión 1.1 · Última actualización abril 2026
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
