import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getDashboardKPIs,
  getBulletinTrend,
  getEmailPerformanceByBulletin,
  getNewsByCategory,
  getNewsBySource,
  getPipelinePerformance,
  getRecentActivity,
} from "@/lib/db/queries/dashboard";
import { DashboardCharts } from "./components/dashboard-charts";
import { FileText, Users, MailOpen, Newspaper } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const [kpis, bulletinTrend, emailPerformance, newsByCategory, newsBySource, pipeline, recentActivity] =
    await Promise.all([
      getDashboardKPIs(),
      getBulletinTrend(),
      getEmailPerformanceByBulletin(),
      getNewsByCategory(),
      getNewsBySource(),
      getPipelinePerformance(),
      getRecentActivity(),
    ]);

  const actionLabels: Record<string, { label: string; color: string }> = {
    authorized: { label: "Autorizado", color: "bg-green-100 text-green-800" },
    published: { label: "Publicado", color: "bg-blue-100 text-blue-800" },
    deleted: { label: "Eliminado", color: "bg-red-100 text-red-800" },
    email_sent: { label: "Email Enviado", color: "bg-purple-100 text-purple-800" },
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<FileText className="h-5 w-5 text-[#004aad]" />}
          title="Boletines Publicados"
          value={kpis.bulletins.published}
          subtitle={`+${kpis.bulletins.publishedThisWeek} esta semana`}
          bgIcon="bg-blue-50"
        />
        <KpiCard
          icon={<Users className="h-5 w-5 text-[#10b981]" />}
          title="Suscriptores Activos"
          value={kpis.subscribers.active}
          subtitle={`+${kpis.subscribers.newThisWeek} esta semana`}
          bgIcon="bg-green-50"
        />
        <KpiCard
          icon={<MailOpen className="h-5 w-5 text-[#f59e0b]" />}
          title="Tasa de Apertura"
          value={`${kpis.email.openRate}%`}
          subtitle={`${kpis.email.totalOpened} de ${kpis.email.totalSent} emails`}
          bgIcon="bg-amber-50"
        />
        <KpiCard
          icon={<Newspaper className="h-5 w-5 text-[#6b7280]" />}
          title="Noticias Procesadas"
          value={kpis.news.total}
          subtitle={`~${kpis.news.avgPerBulletin} por boletín`}
          bgIcon="bg-gray-50"
        />
      </div>

      {/* Charts (client component) */}
      <DashboardCharts
        bulletinTrend={bulletinTrend}
        emailPerformance={emailPerformance}
        newsByCategory={newsByCategory}
        newsBySource={newsBySource}
      />

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((log) => {
                const cfg = actionLabels[log.action] || { label: log.action, color: "bg-gray-100 text-gray-800" };
                return (
                  <div key={log.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-gray-700 truncate">{log.userName}</span>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {new Intl.DateTimeFormat("es-EC", { dateStyle: "short", timeStyle: "short" }).format(new Date(log.createdAt))}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Sin actividad reciente</p>
          )}
        </div>

        {/* Pipeline Performance */}
        <div className="bg-white rounded-lg border p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Rendimiento Pipeline</h3>
          {pipeline.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2">Etapa</th>
                  <th className="pb-2 text-right">Tiempo Prom.</th>
                  <th className="pb-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pipeline.map((p) => (
                  <tr key={p.step} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-700 capitalize">{p.step}</td>
                    <td className="py-2 text-right text-gray-600">{p.avgDurationFormatted}</td>
                    <td className="py-2 text-right">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          p.status === "slow" ? "bg-red-500" : p.status === "warning" ? "bg-yellow-500" : "bg-green-500"
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Sin datos de pipeline</p>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  title,
  value,
  subtitle,
  bgIcon,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  bgIcon: string;
}) {
  return (
    <div className="bg-white rounded-lg border p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${bgIcon}`}>{icon}</div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}
