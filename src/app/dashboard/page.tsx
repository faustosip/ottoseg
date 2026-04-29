import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  getDashboardKPIs,
  getBulletinTrend,
  getEmailPerformanceByBulletin,
  getNewsByCategory,
  getNewsBySource,
  getPipelinePerformance,
  getRecentActivity,
} from "@/lib/db/queries/dashboard";
import { getAllBulletins, getTodayBulletin } from "@/lib/db/queries/bulletins";
import type { Bulletin } from "@/lib/schema";
import { Topline } from "@/components/dashboard/topline";
import { PageHeader } from "@/components/dashboard/page-header";
import { Hero } from "@/components/dashboard/hero";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  LastBulletinsPanel,
  type BulletinRow,
} from "@/components/dashboard/last-bulletins-panel";
import {
  NextStepsPanel,
  type NextStep,
} from "@/components/dashboard/next-steps-panel";
import { FooterNote } from "@/components/dashboard/footer-note";
import type {
  PipelineStep,
  PipelineStepStatus,
} from "@/components/dashboard/pipeline-steps";

function derivePipelineSteps(today: Bulletin | null): PipelineStep[] {
  if (!today) {
    return [
      { label: "Scraping", sub: "esperando", status: "pending" },
      { label: "Clasif.", sub: "—", status: "pending" },
      { label: "Resumen", sub: "—", status: "pending" },
      { label: "Video", sub: "—", status: "pending" },
      { label: "Enviar", sub: "—", status: "pending" },
    ];
  }

  const s = today.status;
  const hasRaw = !!today.rawNews;
  const hasClassified = !!today.classifiedNews;
  const hasSummary = !!(
    today.economia ||
    today.politica ||
    today.sociedad ||
    today.seguridad ||
    today.internacional ||
    today.vial
  );
  const finalVideo = today.finalVideoStatus;
  const sent = !!today.emailSentAt || s === "published";

  const scraping: PipelineStepStatus =
    s === "scraping" ? "now" : hasRaw || s !== "draft" ? "done" : "pending";

  const clasif: PipelineStepStatus =
    s === "classifying"
      ? "now"
      : hasClassified ||
          ["summarizing", "ready", "authorized", "video_processing", "published"].includes(s)
        ? "done"
        : "pending";

  const resumen: PipelineStepStatus =
    s === "summarizing"
      ? "now"
      : hasSummary || ["ready", "authorized", "video_processing", "published"].includes(s)
        ? "done"
        : "pending";

  const video: PipelineStepStatus =
    finalVideo === "completed"
      ? "done"
      : finalVideo && finalVideo !== "pending"
        ? "now"
        : s === "video_processing"
          ? "now"
          : ["published"].includes(s)
            ? "done"
            : "pending";

  const enviar: PipelineStepStatus = sent
    ? "done"
    : s === "authorized" || s === "ready"
      ? "now"
      : "pending";

  const subFor = (st: PipelineStepStatus, doneSub = "ok", nowSub = "en curso") =>
    st === "done" ? doneSub : st === "now" ? nowSub : "—";

  return [
    { label: "Scraping", sub: subFor(scraping, "ok", "en curso"), status: scraping },
    { label: "Clasif.", sub: subFor(clasif), status: clasif },
    { label: "Resumen", sub: subFor(resumen), status: resumen },
    { label: "Video", sub: subFor(video), status: video },
    {
      label: "Enviar",
      sub: enviar === "done" ? "enviado" : enviar === "now" ? "en cola" : "en cola",
      status: enviar,
    },
  ];
}

function statusToPill(status: string): { label: string; variant: BulletinRow["pill"]["variant"] } {
  switch (status) {
    case "published":
      return { label: "enviado", variant: "ok" };
    case "failed":
      return { label: "error", variant: "err" };
    case "authorized":
    case "ready":
    case "video_processing":
    case "summarizing":
    case "classifying":
    case "scraping":
      return { label: "en proceso", variant: "run" };
    case "draft":
      return { label: "borrador", variant: "muted" };
    default:
      return { label: status, variant: "muted" };
  }
}

function formatPipelineTotal(totalMs: number) {
  if (totalMs <= 0) return "—";
  const totalSec = Math.round(totalMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function todayLabel(): string {
  const fmt = new Intl.DateTimeFormat("es-EC", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return fmt.format(new Date()).toUpperCase().replace(/\./g, "");
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const [userData] = await db
    .select({ allowedMenus: user.allowedMenus })
    .from(user)
    .where(eq(user.id, session.user.id));

  if (userData?.allowedMenus && !userData.allowedMenus.includes("dashboard")) {
    if (userData.allowedMenus.includes("boletines")) {
      redirect("/dashboard/bulletin");
    }
  }

  const [
    kpis,
    bulletinTrend,
    emailPerformance,
    newsByCategory,
    newsBySource,
    pipeline,
    recentActivity,
    todayBulletin,
    latestBulletins,
  ] = await Promise.all([
    getDashboardKPIs(),
    getBulletinTrend(),
    getEmailPerformanceByBulletin(),
    getNewsByCategory(),
    getNewsBySource(),
    getPipelinePerformance(),
    getRecentActivity(),
    getTodayBulletin(),
    getAllBulletins({ limit: 5, orderBy: "date", order: "desc" }),
  ]);

  // Sparkline: open rates de los últimos 7 envíos con etiqueta de fecha.
  const sparkline = emailPerformance.slice(-7).map((p) => ({
    value: p.sent > 0 ? Math.round((p.opened / p.sent) * 100) : 0,
    label: p.bulletinDate.replace(/\.$/, "").toUpperCase(),
  }));

  // Sparkline boletines · trend semanal (últimas 8 semanas).
  const bulletinSpark = bulletinTrend.slice(-8).map((t) => ({
    value: t.count,
    label: t.week.replace(/\.$/, "").toUpperCase(),
  }));

  // Stack: tiempo promedio por etapa del proceso.
  const stepLabels: Record<string, string> = {
    scraping: "Scraping",
    classifying: "Clasificación",
    summarizing: "Resumen",
    video: "Video",
    sending: "Envío",
  };
  const fmtMs = (ms: number) =>
    ms >= 60000
      ? `${(ms / 60000).toFixed(1)}min`
      : ms >= 1000
        ? `${(ms / 1000).toFixed(1)}s`
        : `${ms}ms`;
  const processStack = pipeline
    .filter((p) => p.avgDuration > 0)
    .map((p) => ({
      label: stepLabels[p.step] ?? p.step,
      value: p.avgDuration,
      display: fmtMs(p.avgDuration),
    }));

  // Suscriptores netos breakdown.
  const engagement =
    kpis.email.totalSent > 0
      ? `${Math.round((kpis.email.totalOpened / kpis.email.totalSent) * 100)}%`
      : "—";

  // Pipeline total: suma de promedios de cada step.
  const pipelineTotalMs = pipeline.reduce((acc, p) => acc + p.avgDuration, 0);

  const firstName = (session.user.name ?? session.user.email ?? "")
    .trim()
    .split(/\s+/)[0];

  const todaySteps = derivePipelineSteps(todayBulletin);
  const todayCategoryCount = todayBulletin?.classifiedNews
    ? Object.keys(todayBulletin.classifiedNews as Record<string, unknown>).length
    : 0;
  const heroTitle = todayBulletin
    ? todayBulletin.status === "published"
      ? "Boletín enviado a las 06:00"
      : todayBulletin.status === "failed"
        ? "Error en el proceso de hoy"
        : "Listo para enviar a las 06:00"
    : "Sin boletín generado hoy";

  const heroMeta = todayBulletin ? (
    <>
      <b>{todayBulletin.totalNews ?? 0} noticias</b>
      {todayCategoryCount > 0 ? <> · {todayCategoryCount} categorías</> : null}
      {" · "}
      <b>{kpis.subscribers.active.toLocaleString("es-EC")}</b> destinatarios
    </>
  ) : (
    <>Aún no se ha iniciado el proceso de hoy.</>
  );

  const lastBulletinRows: BulletinRow[] = latestBulletins.map((b) => {
    const pill = statusToPill(b.status);
    const perf = emailPerformance.find(
      (p) => p.bulletinDate === new Date(b.date).toLocaleDateString("es-EC", { day: "2-digit", month: "short" }),
    );
    const stat =
      perf && perf.sent > 0
        ? `${b.totalNews ?? 0} · ${Math.round((perf.opened / perf.sent) * 100)}% ap.`
        : `${b.totalNews ?? 0} not.`;
    const topCategory = b.classifiedNews
      ? Object.entries(b.classifiedNews as Record<string, unknown[]>)
          .filter(([, v]) => Array.isArray(v) && v.length > 0)
          .sort((a, b) => (b[1] as unknown[]).length - (a[1] as unknown[]).length)[0]?.[0]
      : undefined;
    return {
      id: b.id,
      date: b.date,
      title: `Boletín ${new Date(b.date).toLocaleDateString("es-EC", { day: "2-digit", month: "short" })}`,
      meta: topCategory ? `destacado · ${topCategory}` : undefined,
      stat,
      pill,
      href: `/dashboard/bulletin/${b.id}`,
      dateColor: b.status === "failed" ? "error" : "default",
    };
  });

  const nextSteps: NextStep[] = [];
  if (todayBulletin && todayBulletin.status !== "published" && todayBulletin.status !== "failed") {
    nextSteps.push({
      title: "Revisar boletín de hoy",
      description: "Pendiente de aprobación editorial.",
    });
  }
  if (todayBulletin?.status === "failed") {
    nextSteps.push({
      title: "Falla en el proceso de hoy",
      description: "Revisar errores antes de relanzar.",
    });
  }
  const failedSources = newsBySource.length === 0;
  if (failedSources) {
    nextSteps.push({
      title: "Sin actividad de fuentes",
      description: "Validar conectividad con scrapers.",
    });
  }
  if (kpis.subscribers.newThisWeek > 0) {
    nextSteps.push({
      title: `${kpis.subscribers.newThisWeek} suscriptores nuevos esta semana`,
      description: "Considera segmentarlos para el próximo envío.",
    });
  }
  if (recentActivity.length > 0 && nextSteps.length < 4) {
    nextSteps.push({
      title: "Revisar actividad reciente",
      description: `${recentActivity.length} acciones en auditoría.`,
    });
  }
  if (nextSteps.length === 0) {
    nextSteps.push({
      title: "Programar envío de mañana",
      description: 'Confirmar segmento "Engaged 30d".',
    });
  }

  // Sparkline / trend usage anchor (impide tree-shake/lint warning sin tocar el query).
  void bulletinTrend;
  void newsByCategory;

  return (
    <>
      <Topline crumbs={["Operación", "Hoy"]} />
      <PageHeader
        title={firstName ? `Hola, ` : "Hola"}
        highlight={firstName ? `${firstName}.` : undefined}
        lede="Estado del boletín de hoy y lo que necesita tu atención antes del envío de las 06:00."
      />

      <Hero
        tag={`Edición · ${todayLabel()}`}
        title={heroTitle}
        meta={heroMeta}
        steps={todaySteps}
        actions={
          <>
            {todayBulletin ? (
              <Link
                href={`/dashboard/bulletin/${todayBulletin.id}`}
                className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold text-white"
                style={{
                  background: "var(--otto-primary)",
                  boxShadow: "0 4px 14px rgba(214,40,40,.28)",
                }}
              >
                {todayBulletin.status === "published"
                  ? "Ver boletín →"
                  : "Autorizar y enviar →"}
              </Link>
            ) : (
              <Link
                href="/dashboard/bulletin/generate"
                className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold text-white"
                style={{
                  background: "var(--otto-primary)",
                  boxShadow: "0 4px 14px rgba(214,40,40,.28)",
                }}
              >
                Generar boletín →
              </Link>
            )}
            <Link
              href="/dashboard/bulletin"
              className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold text-white"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,.22)",
              }}
            >
              Previsualizar
            </Link>
          </>
        }
      />

      <div className="mb-[22px] grid grid-cols-4 gap-3.5">
        <KpiCard
          featured
          title="Apertura · último envío"
          value={kpis.email.openRate}
          suffix="%"
          delta={{
            dir: "up",
            text: `${kpis.email.totalOpened.toLocaleString("es-EC")} de ${kpis.email.totalSent.toLocaleString("es-EC")} envíos`,
          }}
          sparkline={sparkline.length > 0 ? sparkline : undefined}
        />
        <KpiCard
          title="Suscriptores netos · 7d"
          value={`+${kpis.subscribers.newThisWeek}`}
          delta={{
            dir: kpis.subscribers.newThisWeek >= 0 ? "up" : "down",
            text: `${kpis.subscribers.active.toLocaleString("es-EC")} activos`,
          }}
          blockTitle="Composición de la audiencia"
          breakdown={[
            {
              label: "Activos",
              value: kpis.subscribers.active.toLocaleString("es-EC"),
              tone: "ok",
            },
            {
              label: "Engagement",
              value: engagement,
              tone: "ink",
            },
            {
              label: "Total enviado",
              value: kpis.email.totalSent.toLocaleString("es-EC"),
              tone: "muted",
            },
          ]}
        />
        <KpiCard
          title="Boletines · 7d"
          value={kpis.bulletins.publishedThisWeek}
          delta={{
            dir: "flat",
            text: `${kpis.bulletins.published} publicados en total`,
          }}
          sparkline={bulletinSpark.length > 0 ? bulletinSpark : undefined}
          sparkUnit=""
        />
        <KpiCard
          title="Proceso · prom."
          value={formatPipelineTotal(pipelineTotalMs)}
          delta={{
            dir: pipelineTotalMs <= 600_000 ? "up" : "down",
            text: pipelineTotalMs > 0 ? "vs objetivo 10:00" : "sin datos",
          }}
          blockTitle="Tiempo por etapa"
          stack={processStack}
        />
      </div>

      <div
        className="grid gap-[18px]"
        style={{ gridTemplateColumns: "1.4fr 1fr" }}
      >
        <LastBulletinsPanel rows={lastBulletinRows} />
        <NextStepsPanel steps={nextSteps} />
      </div>

      <FooterNote>OttoSeguridad · Console · Hoy</FooterNote>
    </>
  );
}
