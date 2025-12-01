"use client";

import Image from "next/image";
import type { Bulletin } from "@/lib/schema";
import type { ClassifiedNews, ClassifiedArticle } from "@/lib/news/classifier";

interface PublicBulletinViewProps {
  bulletin: Bulletin;
  formattedDate: string;
}

// Mapeo de categorías a español
const categoryNames: Record<string, string> = {
  economia: "Economía",
  politica: "Política",
  sociedad: "Sociedad",
  seguridad: "Seguridad",
  internacional: "Internacional",
  vial: "Vial",
};

/**
 * Vista pública del boletín - Diseño limpio sin menús
 * Incluye footer profesional con logos de la empresa
 */
export function PublicBulletinView({ bulletin, formattedDate }: PublicBulletinViewProps) {
  const classifiedNews = bulletin.classifiedNews as ClassifiedNews | null;

  if (!classifiedNews) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No hay contenido disponible</p>
      </div>
    );
  }

  // Obtener categorías con noticias
  const categoriesWithNews = Object.entries(classifiedNews).filter(
    ([, news]) => news && news.length > 0
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header con banner profesional */}
      <header className="relative w-full bg-gradient-to-r from-gray-900 to-red-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/logos/buho-seguridad.png"
            alt="Otto Seguridad"
            fill
            className="object-contain object-right opacity-10"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        <div className="relative container mx-auto px-6 py-12 max-w-6xl">
          <div className="text-center">
            {/* Logo principal */}
            <div className="mb-6 flex justify-center">
              <Image
                src="/logos/otto-logo.png"
                alt="OTTO Seguridad"
                width={200}
                height={80}
                className="h-20 w-auto"
                priority
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <h1 className="text-5xl font-bold mb-2 tracking-wide">
              RESUMEN DIARIO DE NOTICIAS
            </h1>
            <div className="h-1 w-32 bg-red-600 mx-auto mb-4"></div>
            <p className="text-2xl font-light capitalize">
              {formattedDate}
            </p>
          </div>
        </div>
      </header>

      {/* Contenido del boletín */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {categoriesWithNews.map(([category, news], categoryIndex) => (
          <section key={category} className="mb-16">
            {/* Título de categoría con diseño elegante */}
            <div className="flex items-center mb-8">
              <div className="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                {categoryIndex + 1}
              </div>
              <div className="flex-grow ml-4">
                <h2 className="text-3xl font-bold text-gray-900">
                  {categoryNames[category]}
                </h2>
                <div className="h-1 bg-gray-200 mt-2"></div>
              </div>
            </div>

            {/* Noticias de la categoría */}
            <div className="space-y-12">
              {news.map((article: ClassifiedArticle, index: number) => (
                <article
                  key={`${category}-${index}`}
                  className="bg-white rounded-lg overflow-hidden"
                >
                  {/* Imagen de la noticia */}
                  {article.imageUrl && (
                    <div className="w-full h-80 bg-gray-100 mb-6 rounded-lg overflow-hidden">
                      <Image
                        src={article.imageUrl}
                        alt={article.title}
                        width={800}
                        height={320}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.parentElement!.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  {/* Contenido de la noticia */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-blue-900 leading-tight">
                      {article.title}
                    </h3>

                    <p className="text-gray-700 text-lg leading-relaxed">
                      {article.content}
                    </p>

                    {article.url && (
                      <div className="pt-4">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                        >
                          Leer más
                          <svg
                            className="ml-2 w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Separador entre noticias */}
                  {index < news.length - 1 && (
                    <div className="mt-8 border-b border-gray-200"></div>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Footer profesional con logos */}
      <footer className="bg-gradient-to-r from-gray-900 to-black text-white mt-20">
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          {/* Primera fila: Logo del búho grande */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logos/buho-seguridad.png"
              alt="Otto Seguridad Búho"
              width={180}
              height={180}
              className="h-44 w-auto opacity-90"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>

          {/* Segunda fila: Información de la empresa */}
          <div className="text-center mb-8">
            <Image
              src="/logos/otto-logo.png"
              alt="OTTO Seguridad"
              width={150}
              height={60}
              className="h-14 w-auto mx-auto mb-4"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

            <p className="text-lg font-light text-gray-300 mb-2">
              Tu seguridad, nuestra prioridad
            </p>

            <div className="flex justify-center items-center space-x-6 text-sm text-gray-400 mt-6">
              <span>© {new Date().getFullYear()} Otto Seguridad</span>
              <span>•</span>
              <span>Todos los derechos reservados</span>
            </div>
          </div>

          {/* Línea decorativa final */}
          <div className="border-t border-gray-800 pt-6">
            <div className="flex justify-center items-center space-x-4">
              <div className="text-xs text-gray-500">
                Resumen generado automáticamente el {new Date().toLocaleDateString('es-EC')}
                {' '}a las {new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 max-w-3xl mx-auto">
              Este resumen de noticias es generado automáticamente a partir de fuentes públicas de información.
              Otto Seguridad no se responsabiliza por la exactitud o veracidad del contenido presentado.
              Para información oficial y actualizada, consulte directamente las fuentes originales.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}