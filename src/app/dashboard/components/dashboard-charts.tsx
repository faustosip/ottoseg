"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = {
  blue: "#004aad",
  lightBlue: "#1a62ff",
  green: "#10b981",
  red: "#ef4444",
  yellow: "#f59e0b",
  gray: "#6b7280",
};

const PIE_COLORS = ["#004aad", "#1a62ff", "#10b981", "#f59e0b", "#ef4444", "#6b7280"];

interface DashboardChartsProps {
  bulletinTrend: Array<{ week: string; count: number }>;
  emailPerformance: Array<{ bulletinDate: string; sent: number; opened: number }>;
  newsByCategory: Array<{ category: string; count: number }>;
  newsBySource: Array<{ source: string; count: number }>;
}

export function DashboardCharts({
  bulletinTrend,
  emailPerformance,
  newsByCategory,
  newsBySource,
}: DashboardChartsProps) {
  return (
    <>
      {/* Row 1: Line chart + Bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bulletin trend */}
        <div className="bg-white rounded-lg border p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Boletines por Semana
          </h3>
          {bulletinTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={bulletinTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.blue}
                  strokeWidth={2}
                  dot={{ fill: COLORS.blue, r: 4 }}
                  name="Boletines"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Email performance */}
        <div className="bg-white rounded-lg border p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Emails: Enviados vs Abiertos
          </h3>
          {emailPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={emailPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="bulletinDate" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sent" fill={COLORS.blue} name="Enviados" radius={[2, 2, 0, 0]} />
                <Bar dataKey="opened" fill={COLORS.green} name="Abiertos" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      {/* Row 2: Pie chart + Horizontal bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* News by category */}
        <div className="bg-white rounded-lg border p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Noticias por Categoría
          </h3>
          {newsByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={newsByCategory}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={{ strokeWidth: 1 }}
                >
                  {newsByCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* News by source */}
        <div className="bg-white rounded-lg border p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Artículos por Fuente
          </h3>
          {newsBySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={newsBySource} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="source" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.lightBlue} name="Artículos" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>
    </>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[250px] text-sm text-gray-400">
      Sin datos disponibles
    </div>
  );
}
