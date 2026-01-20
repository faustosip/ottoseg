"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulletinRenderer } from "@/components/bulletin/bulletin-renderer";
import { DesignSwitcher, useDesignPreference } from "@/components/bulletin/design-switcher";
import { EditableBulletin } from "@/components/bulletin/editable-bulletin";
import type { Bulletin } from "@/lib/schema";
import type { BulletinData } from "@/components/bulletin/classic-bulletin-layout";
import { CheckCircle2, XCircle, Loader2, Clock, Edit } from "lucide-react";
import type { ClassifiedNews } from "@/lib/news/classifier";
import { toast } from "sonner";

/**
 * Log entry type
 */
interface BulletinLog {
  id: string;
  step: string;
  status: string;
  message?: string;
  createdAt: Date;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Props para BulletinDetailTabs
 */
interface BulletinDetailTabsProps {
  bulletin: Bulletin;
  logs: BulletinLog[];
}

/**
 * Componente BulletinDetailTabs
 *
 * Tabs con toda la información del boletín
 */
export function BulletinDetailTabs({ bulletin, logs }: BulletinDetailTabsProps) {
  const [design, setDesign] = useDesignPreference("classic");

  // Convertir Bulletin a BulletinData para los layouts
  const classifiedNews = bulletin.classifiedNews as ClassifiedNews | null;

  // Helper para obtener la primera imagen de una categoría
  const getFirstImageUrl = (newsArray: ClassifiedNews[keyof ClassifiedNews] | undefined): string | undefined => {
    return newsArray?.find((n) => n.imageUrl)?.imageUrl;
  };

  const bulletinData: BulletinData = {
    date: bulletin.date,
    economia: bulletin.economia
      ? {
          title: "Economía",
          summary: bulletin.economia,
          news: classifiedNews?.economia || [],
          imageUrl: getFirstImageUrl(classifiedNews?.economia),
        }
      : undefined,
    politica: bulletin.politica
      ? {
          title: "Política",
          summary: bulletin.politica,
          news: classifiedNews?.politica || [],
          imageUrl: getFirstImageUrl(classifiedNews?.politica),
        }
      : undefined,
    sociedad: bulletin.sociedad
      ? {
          title: "Sociedad",
          summary: bulletin.sociedad,
          news: classifiedNews?.sociedad || [],
          imageUrl: getFirstImageUrl(classifiedNews?.sociedad),
        }
      : undefined,
    seguridad: bulletin.seguridad
      ? {
          title: "Seguridad",
          summary: bulletin.seguridad,
          news: classifiedNews?.seguridad || [],
          imageUrl: getFirstImageUrl(classifiedNews?.seguridad),
        }
      : undefined,
    internacional: bulletin.internacional
      ? {
          title: "Internacional",
          summary: bulletin.internacional,
          news: classifiedNews?.internacional || [],
          imageUrl: getFirstImageUrl(classifiedNews?.internacional),
        }
      : undefined,
    vial: bulletin.vial
      ? {
          title: "Vial",
          summary: bulletin.vial,
          news: classifiedNews?.vial || [],
          imageUrl: getFirstImageUrl(classifiedNews?.vial),
        }
      : undefined,
    roadClosureMapUrl: bulletin.roadClosureMapUrl,
  };

  // Función para guardar cambios del boletín editado
  const handleSaveBulletin = async (editedData: ClassifiedNews, roadClosureMapUrl?: string | null) => {
    try {
      // Update classified news
      const response = await fetch(`/api/bulletins/${bulletin.id}/update-classified`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classifiedNews: editedData })
      });

      if (!response.ok) {
        throw new Error('Error al guardar cambios');
      }

      // Update roadClosureMapUrl if provided
      if (roadClosureMapUrl !== undefined) {
        const mapResponse = await fetch(`/api/bulletins/${bulletin.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roadClosureMapUrl: roadClosureMapUrl || null })
        });

        if (!mapResponse.ok) {
          console.error('Error updating roadClosureMapUrl');
        }
      }

      toast.success('Boletín actualizado exitosamente');

      // Recargar la página para ver los cambios
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar los cambios');
      throw error;
    }
  };

  return (
    <Tabs defaultValue="resumes" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="resumes">Resúmenes</TabsTrigger>
        <TabsTrigger value="edit" className="flex items-center gap-1">
          <Edit className="h-3 w-3" />
          Editar
        </TabsTrigger>
        <TabsTrigger value="raw">Noticias Raw</TabsTrigger>
        <TabsTrigger value="classified">Clasificadas</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
        <TabsTrigger value="video">Video</TabsTrigger>
      </TabsList>

      {/* Tab 1: Resúmenes */}
      <TabsContent value="resumes" className="mt-6">
        <div className="space-y-6">
          {/* Design Switcher */}
          <div className="flex justify-center">
            <DesignSwitcher
              currentDesign={design}
              onDesignChange={setDesign}
            />
          </div>

          {/* Renderer del boletín */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {classifiedNews && Object.values(classifiedNews).some((cat) => cat && cat.length > 0) ? (
              <BulletinRenderer
                bulletin={bulletinData}
                design={design}
                editable={false}
              />
            ) : bulletin.rawNews ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Noticias listas para editar
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Las noticias han sido scrapeadas exitosamente. Ahora puedes seleccionar cuáles incluir en el boletín.
                  </p>
                  <a
                    href={`/dashboard/bulletin/${bulletin.id}/edit`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Editar y Procesar Noticias
                  </a>
                  <p className="text-gray-500 text-xs mt-4">
                    Después de seleccionar las noticias, se clasificarán automáticamente por categorías
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Los resúmenes aún no están disponibles. El boletín está en estado:{" "}
                  <strong>{bulletin.status}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Tab 2: Editar */}
      <TabsContent value="edit" className="mt-6">
        {classifiedNews ? (
          <EditableBulletin
            bulletinId={bulletin.id}
            date={bulletin.date}
            initialData={classifiedNews}
            initialRoadClosureMapUrl={bulletin.roadClosureMapUrl}
            onSave={handleSaveBulletin}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No hay noticias clasificadas para editar.
            </p>
          </div>
        )}
      </TabsContent>

      {/* Tab 3: Noticias Raw */}
      <TabsContent value="raw" className="mt-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Noticias Scrapeadas</h3>
          {bulletin.rawNews ? (
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(bulletin.rawNews, null, 2)}
            </pre>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No hay noticias scrapeadas disponibles todavía.
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      {/* Tab 4: Noticias Clasificadas */}
      <TabsContent value="classified" className="mt-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Noticias Clasificadas por Categoría</h3>
          {bulletin.classifiedNews ? (
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(bulletin.classifiedNews, null, 2)}
            </pre>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                Las noticias aún no han sido clasificadas.
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      {/* Tab 5: Logs */}
      <TabsContent value="logs" className="mt-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Timeline de Eventos</h3>
          {logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <LogItem key={log.id} log={log} isLast={index === logs.length - 1} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No hay logs registrados para este boletín.
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      {/* Tab 6: Video */}
      <TabsContent value="video" className="mt-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Video del Boletín</h3>

          {bulletin.videoUrl ? (
            <div className="space-y-4">
              <video
                src={bulletin.videoUrl}
                controls
                className="w-full max-w-2xl mx-auto rounded-lg"
              >
                Tu navegador no soporta el elemento de video.
              </video>
            </div>
          ) : bulletin.videoStatus === "processing" ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">
                Generando video...
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Este proceso puede tomar varios minutos
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                El video aún no ha sido generado para este boletín.
              </p>
              <p className="text-sm text-gray-400">
                Status: {bulletin.videoStatus || "pending"}
              </p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

/**
 * Componente LogItem
 *
 * Muestra un item individual del timeline de logs
 */
interface LogItemProps {
  log: BulletinLog;
  isLast: boolean;
}

function LogItem({ log, isLast }: LogItemProps) {
  // Icono según el status
  const StatusIcon = () => {
    switch (log.status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "in_progress":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  // Color según el status
  const getStatusColor = () => {
    switch (log.status) {
      case "completed":
        return "text-green-700 bg-green-50 border-green-200";
      case "failed":
      case "error":
        return "text-red-700 bg-red-50 border-red-200";
      case "in_progress":
        return "text-blue-700 bg-blue-50 border-blue-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  // Formatear timestamp
  const formattedTime = new Intl.DateTimeFormat("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(log.createdAt));

  return (
    <div className="flex gap-4">
      {/* Timeline vertical */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-200">
          <StatusIcon />
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-gray-200 flex-1 mt-2" />
        )}
      </div>

      {/* Contenido del log */}
      <div className="flex-1 pb-8">
        <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h4 className="font-semibold capitalize">{log.step}</h4>
              <p className="text-sm opacity-75 capitalize">{log.status}</p>
            </div>
            <div className="text-right text-sm opacity-75">
              <p>{formattedTime}</p>
              {log.duration && (
                <p>{(log.duration / 1000).toFixed(2)}s</p>
              )}
            </div>
          </div>

          {log.message && (
            <p className="text-sm mt-2">{log.message}</p>
          )}

          {log.metadata && (
            <details className="mt-2">
              <summary className="text-sm cursor-pointer opacity-75 hover:opacity-100">
                Ver metadata
              </summary>
              <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
