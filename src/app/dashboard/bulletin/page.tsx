import { Suspense } from "react";
import { getAllBulletins, getTodayBulletin } from "@/lib/db/queries/bulletins";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";
import { BulletinList } from "./components/bulletin-list";
import { BulletinCard } from "@/components/bulletin/bulletin-card";

/**
 * Página Lista de Boletines
 *
 * Muestra todos los boletines generados con filtros y paginación
 */
export default async function BulletinListPage() {
  // Cargar boletines iniciales
  const bulletins = await getAllBulletins({
    limit: 20,
    orderBy: "createdAt",
    order: "desc",
  });

  // Verificar si existe boletín de hoy
  const todayBulletin = await getTodayBulletin();
  const hasTodayBulletin = !!todayBulletin;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Boletines Diarios
          </h1>
          <p className="text-gray-600">
            Gestiona y visualiza todos los boletines de noticias generados
          </p>
        </div>

        {/* Botón Generar Nuevo */}
        <Link href="/dashboard/bulletin/generate">
          <Button
            size="lg"
            disabled={hasTodayBulletin && todayBulletin?.status !== "failed"}
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            Generar Nuevo Boletín
          </Button>
        </Link>
      </div>

      {/* Mensaje si ya existe boletín de hoy */}
      {hasTodayBulletin && todayBulletin?.status !== "failed" && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Boletín de hoy ya existe.</strong> El boletín del día actual está en proceso o completado.
            Solo puedes generar uno por día.
          </p>
        </div>
      )}

      {/* Lista de Boletines */}
      <Suspense fallback={<BulletinListSkeleton />}>
        {bulletins.length > 0 ? (
          <BulletinList bulletins={bulletins} />
        ) : (
          <EmptyState />
        )}
      </Suspense>
    </div>
  );
}

/**
 * Estado vacío cuando no hay boletines
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FileText className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No hay boletines generados
      </h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        Aún no se ha generado ningún boletín. Comienza creando el primer boletín diario.
      </p>
      <Link href="/dashboard/bulletin/generate">
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Generar Primer Boletín
        </Button>
      </Link>
    </div>
  );
}

/**
 * Loading skeleton para lista de boletines
 */
function BulletinListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-64 bg-gray-100 rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}
