"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Bulletin } from "@/lib/schema";
import type { ClassifiedArticle } from "@/lib/news/classifier";

interface PublicBulletinViewProps {
  bulletin: Bulletin;
  formattedDate: string;
}

/**
 * Limpia texto de URLs, hashtags y contenido promocional
 */
function cleanDisplayText(text: string): string {
  return text
    // Remove URLs (http/https/www)
    .replace(/https?:\/\/\S+/g, "")
    .replace(/www\.\S+/g, "")
    // Remove hashtags
    .replace(/#\w+/g, "")
    // Remove "pic.twitter.com" and similar
    .replace(/pic\.twitter\.com\/\S+/g, "")
    // Remove "Más información:" prefixes
    .replace(/Más información:\s*/gi, "")
    // Remove "Contenido Patrocinado" and similar promo text
    .replace(/Contenido Patrocinado\s*/gi, "")
    // Remove "enlace:" prefixes
    .replace(/(?:siguiente\s+)?enlace:\s*/gi, "")
    // Clean up multiple spaces and newlines
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Trunca texto a un número aproximado de líneas (oraciones)
 */
function truncateToLines(text: string, maxSentences: number = 5): string {
  const cleaned = cleanDisplayText(text);
  // Split by sentence boundaries
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length <= maxSentences) return cleaned;
  return sentences.slice(0, maxSentences).join(" ").trim();
}

/**
 * Vista pública del boletín - Layout de 3 columnas
 * Columna izquierda: Video | Centro: Noticias | Derecha: Última Hora
 */
export function PublicBulletinView({ bulletin, formattedDate }: PublicBulletinViewProps) {
  const rawClassifiedNews = bulletin.classifiedNews as Record<string, ClassifiedArticle[]> | null;

  // Merge fullContent from fullArticles into classifiedNews for backward compatibility
  const classifiedNews = (() => {
    if (!rawClassifiedNews) return null;

    const fullArticles = bulletin.fullArticles as Record<string, Array<{ url?: string; title?: string; fullContent?: string }>> | null;
    if (!fullArticles) return rawClassifiedNews;

    // Check if classifiedNews already has fullContent
    const hasFullContent = Object.values(rawClassifiedNews).some(
      articles => articles.some(a => a.fullContent)
    );
    if (hasFullContent) return rawClassifiedNews;

    // Build lookup map from fullArticles
    const fullContentMap = new Map<string, string>();
    for (const articles of Object.values(fullArticles)) {
      if (!Array.isArray(articles)) continue;
      for (const article of articles) {
        if (article.fullContent) {
          if (article.url) fullContentMap.set(article.url, article.fullContent);
          if (article.title) fullContentMap.set(article.title.trim().toLowerCase(), article.fullContent);
        }
      }
    }

    if (fullContentMap.size === 0) return rawClassifiedNews;

    // Merge
    const merged: Record<string, ClassifiedArticle[]> = {};
    for (const [category, articles] of Object.entries(rawClassifiedNews)) {
      merged[category] = articles.map(article => {
        const fc = (article.url && fullContentMap.get(article.url))
          || fullContentMap.get(article.title.trim().toLowerCase());
        return fc ? { ...article, fullContent: fc } : article;
      });
    }
    return merged;
  })();

  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [categoryOrders, setCategoryOrders] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/bulletins/categories");
        if (response.ok) {
          const data = await response.json();
          const nameMap: Record<string, string> = {};
          const orderMap: Record<string, number> = {};
          for (const c of data.categories || []) {
            nameMap[c.name] = c.displayName;
            orderMap[c.name] = c.displayOrder ?? 0;
          }
          setCategoryNames(nameMap);
          setCategoryOrders(orderMap);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, []);

  if (!classifiedNews) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No hay contenido disponible</p>
      </div>
    );
  }

  // Separar "ultima_hora" del resto de categorías
  const ultimaHoraNews = classifiedNews.ultima_hora || [];
  const hasUltimaHora = ultimaHoraNews.length > 0;

  // Agrupar última hora por subcategoría
  const ultimaHoraGroups: { category: string; label: string; articles: ClassifiedArticle[] }[] = [];
  if (hasUltimaHora) {
    const grouped: Record<string, ClassifiedArticle[]> = {};
    for (const article of ultimaHoraNews) {
      const key = article.category || "";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(article);
    }
    // Subcategorías primero (ordenadas por nombre), luego los sin subcategoría
    const keys = Object.keys(grouped).sort((a, b) => {
      if (a === "") return 1;
      if (b === "") return -1;
      return (categoryNames[a] || a).localeCompare(categoryNames[b] || b);
    });
    for (const key of keys) {
      ultimaHoraGroups.push({
        category: key,
        label: key ? (categoryNames[key] || key) : "",
        articles: grouped[key],
      });
    }
  }

  // Categorías principales (excluyendo ultima_hora), ordenadas por displayOrder
  const categoriesWithNews = Object.entries(classifiedNews)
    .filter(
      ([category, news]) => category !== "ultima_hora" && news && news.length > 0
    )
    .sort(([a], [b]) => (categoryOrders[a] ?? 999) - (categoryOrders[b] ?? 999));

  const hasVideo = !!bulletin.manualVideoUrl;

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
            {/* Logo del búho y logo principal juntos */}
            <div className="mb-6 flex justify-center items-center gap-8">
              <Image
                src="/logos/buho-seguridad.png"
                alt="Otto Seguridad Búho"
                width={100}
                height={100}
                className="h-24 w-auto"
                priority
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
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

      {/* Última Hora en mobile/tablet (antes del video) */}
      {hasUltimaHora && (
        <div className="lg:hidden px-6 pt-6" id="ultima-hora-mobile">
          <div>
            <h2 className="text-2xl font-bold text-white bg-red-600 rounded-t-lg px-4 py-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              ÚLTIMA HORA
            </h2>
            <div className="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100">
              {ultimaHoraGroups.map((group) => (
                <div key={`uh-mobile-group-${group.category}`}>
                  {group.label && (
                    <div className="px-4 pt-3 pb-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-red-700">
                        {group.label}
                      </h3>
                    </div>
                  )}
                  {group.articles.map((article: ClassifiedArticle, index: number) => (
                    <div key={`uh-mobile-${group.category}-${index}`} className="p-4">
                      {article.imageUrl && (
                        <div className="w-full h-48 bg-gray-100 mb-3 rounded-lg overflow-hidden">
                          <Image
                            src={article.imageUrl}
                            alt={article.title}
                            width={600}
                            height={192}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.parentElement!.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <h4 className="font-bold text-base text-gray-900 leading-snug mb-2">
                        {cleanDisplayText(article.title)}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-5">
                        {truncateToLines(article.content || article.fullContent || "", 5)}
                      </p>
                      {article.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Leer más
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Video en mobile/tablet (después de Última Hora, oculto en desktop) */}
      {hasVideo && (
        <div className="lg:hidden px-6 py-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            VIDEO
          </h2>
          <div className="rounded-lg overflow-hidden bg-black">
            <video
              src={bulletin.manualVideoUrl!}
              controls
              className="w-full"
              style={{ maxHeight: "300px" }}
            >
              Tu navegador no soporta el elemento de video.
            </video>
          </div>
        </div>
      )}

      {/* Layout principal de 3 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-8 max-w-[1400px] mx-auto px-6 py-12">
        {/* Columna izquierda: Video (solo desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              VIDEO
            </h2>
            {hasVideo ? (
              <div className="rounded-lg overflow-hidden bg-black shadow-lg">
                <video
                  src={bulletin.manualVideoUrl!}
                  controls
                  className="w-full"
                >
                  Tu navegador no soporta el elemento de video.
                </video>
              </div>
            ) : (
              <div className="rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 p-8 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">Sin video disponible</p>
              </div>
            )}
          </div>
        </aside>

        {/* Columna centro: Noticias principales */}
        <main>
          {categoriesWithNews.map(([category, news], categoryIndex) => (
            <section key={category} className="mb-16">
              {/* Título de categoría con diseño elegante */}
              <div className="flex items-center mb-8">
                <div className="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {categoryIndex + 1}
                </div>
                <div className="flex-grow ml-4">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {categoryNames[category] || category}
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
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-blue-900 leading-snug">
                        {cleanDisplayText(article.title)}
                      </h3>

                      <p className="text-gray-700 text-base leading-relaxed">
                        {truncateToLines(article.content || article.fullContent || "", 5)}
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

        {/* Columna derecha: Última Hora (solo desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-8" id="ultima-hora">
            <h2 className="text-xl font-bold text-white bg-red-600 rounded-t-lg px-4 py-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              ÚLTIMA HORA
            </h2>
            {hasUltimaHora ? (
              <div className="border border-t-0 border-gray-200 rounded-b-lg divide-y divide-gray-100">
                {ultimaHoraGroups.map((group) => (
                  <div key={`uh-group-${group.category}`}>
                    {group.label && (
                      <div className="px-4 pt-3 pb-1 bg-gray-50">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-red-700">
                          {group.label}
                        </h3>
                      </div>
                    )}
                    {group.articles.map((article: ClassifiedArticle, index: number) => (
                      <div key={`uh-${group.category}-${index}`} className="p-4">
                        <h4 className="font-bold text-sm text-gray-900 leading-snug mb-2">
                          {cleanDisplayText(article.title)}
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                          {truncateToLines(article.content || article.fullContent || "", 4)}
                        </p>
                        {article.url && (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Leer más
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-t-0 border-gray-200 rounded-b-lg p-6 text-center">
                <p className="text-sm text-gray-500">No hay noticias de última hora</p>
              </div>
            )}
          </div>
        </aside>
      </div>

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
