/**
 * Classic Bulletin Layout V2 — diseño editorial pro
 *
 * Elementos editoriales: tag de edición, índice de contenido,
 * source attribution, reading time, drop cap, ornamentos entre secciones.
 */

import Image from "next/image";
import type { ClassifiedNews, ClassifiedArticle } from "@/lib/news/classifier";
import { ArticleBody } from "./article-body";

export interface ClassicBulletinV2Props {
  date: Date;
  classifiedData: ClassifiedNews;
}

const categoryNames: Record<string, string> = {
  economia: "Economía",
  politica: "Política",
  sociedad: "Sociedad",
  seguridad: "Seguridad",
  internacional: "Internacional",
  vial: "Vial",
};

const OTTO_RED = "rgb(214, 40, 40)";
const OTTO_INK = "#0e0e10";
const OTTO_INK_2 = "#3c3c40";
const OTTO_MUTED = "#6c6c72";
const OTTO_RULE = "#e6e5e1";
const OTTO_BG_SOFT = "#faf9f7";

function getDomain(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export function ClassicBulletinV2({
  date,
  classifiedData,
}: ClassicBulletinV2Props) {
  const formattedDate = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const categoriesWithNews = Object.entries(classifiedData).filter(
    ([, news]) => news.length > 0,
  );

  const totalNews = categoriesWithNews.reduce(
    (acc, [, news]) => acc + news.length,
    0,
  );

  const cleanContent = (content: string): string => {
    return content
      .replace(/^-{3,}\s*/gm, "")
      .replace(/\s*-{3,}\s*$/gm, "")
      .replace(/\n\s*-{10,}\s*\n/g, "\n")
      .trim();
  };

  return (
    <article
      className="mx-auto bg-white"
      style={{
        maxWidth: "720px",
        width: "100%",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* HEADER */}
      <header>
        <div
          className="overflow-hidden rounded-[10px]"
          style={{ maxHeight: "180px" }}
        >
          <Image
            src="/banner.png"
            alt="Resumen Diario de Noticias"
            width={1024}
            height={458}
            className="h-auto w-full object-cover"
            style={{ maxHeight: "180px" }}
            priority
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        <div className="px-4 pb-4 pt-7 text-center">
          <div
            className="mb-2.5 inline-flex items-center gap-2"
            style={{
              fontFamily:
                "var(--font-jetbrains-mono), ui-monospace, monospace",
              fontSize: "10px",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: OTTO_RED,
            }}
          >
            <span
              aria-hidden
              style={{
                width: "8px",
                height: "8px",
                background: OTTO_RED,
                transform: "rotate(45deg)",
                display: "inline-block",
              }}
            />
            Edición · {capitalizedDate}
          </div>
          <h1
            style={{
              fontFamily:
                "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "30px",
              lineHeight: 1.1,
              fontWeight: 700,
              color: OTTO_INK,
              letterSpacing: "-0.8px",
              margin: 0,
            }}
          >
            Resumen Diario de Noticias
          </h1>
          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.55,
              fontWeight: 400,
              color: OTTO_MUTED,
              marginTop: "10px",
              marginBottom: 0,
              maxWidth: "440px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Lo más relevante del país, curado por OttoSeguridad.
          </p>

          {/* Stats line */}
          <div
            className="mt-4 inline-flex items-center gap-3"
            style={{
              fontFamily:
                "var(--font-jetbrains-mono), ui-monospace, monospace",
              fontSize: "10px",
              letterSpacing: ".14em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: OTTO_MUTED,
            }}
          >
            <span>{totalNews} notas</span>
            <span style={{ color: OTTO_RULE }}>•</span>
            <span>{categoriesWithNews.length} secciones</span>
          </div>
        </div>

        {/* ÍNDICE / Table of Contents */}
        {categoriesWithNews.length > 1 ? (
          <nav
            className="mx-4 mt-2 mb-6 rounded-[10px] px-4 py-3"
            style={{
              background: OTTO_BG_SOFT,
              border: `1px solid ${OTTO_RULE}`,
            }}
            aria-label="Índice"
          >
            <div
              className="mb-2"
              style={{
                fontFamily:
                  "var(--font-jetbrains-mono), ui-monospace, monospace",
                fontSize: "9px",
                letterSpacing: ".18em",
                textTransform: "uppercase",
                fontWeight: 600,
                color: OTTO_MUTED,
              }}
            >
              En esta edición
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {categoriesWithNews.map(([category, news], idx) => (
                <a
                  key={category}
                  href={`#cat-${category}`}
                  className="inline-flex items-baseline gap-1.5 transition-colors hover:opacity-70"
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: OTTO_INK,
                    textDecoration: "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily:
                        "var(--font-jetbrains-mono), ui-monospace, monospace",
                      fontSize: "10px",
                      color: OTTO_RED,
                      fontWeight: 700,
                      letterSpacing: ".04em",
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {categoryNames[category]}
                  <span
                    style={{
                      fontFamily:
                        "var(--font-jetbrains-mono), ui-monospace, monospace",
                      fontSize: "10px",
                      color: OTTO_MUTED,
                      fontWeight: 500,
                      letterSpacing: ".04em",
                    }}
                  >
                    {news.length}
                  </span>
                </a>
              ))}
            </div>
          </nav>
        ) : (
          <hr
            className="my-6"
            style={{ border: 0, borderTop: `1px solid ${OTTO_RULE}` }}
          />
        )}
      </header>

      {/* SECCIONES */}
      {categoriesWithNews.map(([category, news], categoryIndex) => (
        <section
          key={category}
          id={`cat-${category}`}
          className="px-4 scroll-mt-6"
          style={{ paddingBottom: "32px", paddingTop: "8px" }}
        >
          {/* Tag editorial */}
          <div
            className="mb-2 flex items-center gap-2"
            style={{
              fontFamily:
                "var(--font-jetbrains-mono), ui-monospace, monospace",
              fontSize: "10px",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: OTTO_RED,
            }}
          >
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: "20px",
                height: "2px",
                background: OTTO_RED,
              }}
            />
            {categoryNames[category]} ·{" "}
            {String(categoryIndex + 1).padStart(2, "0")}
          </div>

          {/* Título de categoría */}
          <h2
            style={{
              fontFamily:
                "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "24px",
              lineHeight: 1.15,
              fontWeight: 700,
              color: OTTO_INK,
              letterSpacing: "-0.6px",
              margin: 0,
              marginBottom: "20px",
            }}
          >
            {categoryNames[category]}
          </h2>

          {/* Noticias */}
          <div className="space-y-7">
            {news.map((article: ClassifiedArticle, index: number) => {
              const fullText = article.fullContent || article.content || "";
              const cleaned = cleanContent(fullText);
              const minutes = readingTime(cleaned);
              const domain = getDomain(article.url);
              const isFirst = index === 0;

              return (
                <article key={`${category}-${index}`}>
                  {/* Source attribution */}
                  <div
                    className="mb-2 flex items-center gap-2"
                    style={{
                      fontFamily:
                        "var(--font-jetbrains-mono), ui-monospace, monospace",
                      fontSize: "10px",
                      letterSpacing: ".14em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      color: OTTO_MUTED,
                    }}
                  >
                    {domain ? (
                      <span style={{ color: OTTO_INK_2 }}>{domain}</span>
                    ) : (
                      <span style={{ color: OTTO_INK_2 }}>OttoSeguridad</span>
                    )}
                    <span style={{ color: OTTO_RULE }}>•</span>
                    <span>{minutes} min de lectura</span>
                  </div>

                  {/* Imagen */}
                  {article.imageUrl && (
                    <div
                      className="overflow-hidden rounded-[10px]"
                      style={{
                        width: "100%",
                        aspectRatio: isFirst ? "21 / 9" : "16 / 9",
                        marginBottom: "14px",
                        backgroundColor: "#f5f5f5",
                      }}
                    >
                      <Image
                        src={article.imageUrl}
                        alt={article.title}
                        width={720}
                        height={isFirst ? 308 : 405}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.parentElement!.style.display =
                            "none";
                        }}
                      />
                    </div>
                  )}

                  {/* Título de la noticia */}
                  <h3
                    style={{
                      fontFamily:
                        "var(--font-space-grotesk), system-ui, sans-serif",
                      fontSize: "19px",
                      lineHeight: 1.3,
                      fontWeight: 700,
                      color: OTTO_RED,
                      letterSpacing: "-0.3px",
                      margin: 0,
                      marginBottom: "10px",
                    }}
                  >
                    {article.title}
                  </h3>

                  {/* Contenido sanitizado + colapsable */}
                  <ArticleBody
                    content={cleaned}
                    variant="classic"
                    withDropCap={isFirst}
                  />

                  {/* Link "Leer más" */}
                  {article.url && (
                    <div className="mt-3 text-right">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 transition-colors hover:underline"
                        style={{
                          fontSize: "13px",
                          lineHeight: 1.4,
                          fontWeight: 700,
                          color: OTTO_RED,
                        }}
                      >
                        Leer nota completa →
                      </a>
                    </div>
                  )}

                  {/* Separador entre noticias */}
                  {index < news.length - 1 && (
                    <hr
                      className="mt-7"
                      style={{
                        border: 0,
                        borderTop: `1px solid ${OTTO_RULE}`,
                      }}
                    />
                  )}
                </article>
              );
            })}
          </div>

          {/* Separador entre categorías — ornamento */}
          {categoryIndex < categoriesWithNews.length - 1 && (
            <div
              aria-hidden
              className="mt-9 flex items-center justify-center gap-3"
            >
              <span
                style={{
                  flex: 1,
                  height: "1px",
                  background: `linear-gradient(to right, transparent, ${OTTO_RULE} 30%, ${OTTO_RULE} 70%, transparent)`,
                }}
              />
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  background: OTTO_RED,
                  transform: "rotate(45deg)",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  flex: 1,
                  height: "1px",
                  background: `linear-gradient(to right, transparent, ${OTTO_RULE} 30%, ${OTTO_RULE} 70%, transparent)`,
                }}
              />
            </div>
          )}
        </section>
      ))}

      {/* FOOTER */}
      <footer
        className="mx-4 mt-4 px-2 pb-10 pt-6 text-center"
        style={{ borderTop: `1px solid ${OTTO_RULE}` }}
      >
        <div className="flex justify-center">
          <div
            className="flex h-[44px] w-[44px] items-center justify-center overflow-hidden rounded-[10px]"
            style={{ background: "#000" }}
          >
            <Image
              src="/logos/buho-seguridad.png"
              alt="OttoSeguridad"
              width={88}
              height={48}
              className="h-auto w-[40px] object-contain"
            />
          </div>
        </div>
        <div
          className="mt-3"
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontSize: "14px",
            fontWeight: 700,
            color: OTTO_INK,
            letterSpacing: "-0.2px",
          }}
        >
          OttoSeguridad
        </div>
        <div
          className="mt-1"
          style={{
            fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
            fontSize: "10px",
            letterSpacing: ".18em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: OTTO_MUTED,
          }}
        >
          Resumen Diario · {capitalizedDate}
        </div>
        <div
          className="mt-3 flex items-center justify-center gap-3"
          style={{
            fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
            fontSize: "9px",
            letterSpacing: ".14em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: OTTO_MUTED,
          }}
        >
          <span>Inteligencia · Análisis · Curaduría</span>
        </div>
      </footer>

      <style jsx>{`
        .first-letter-drop::first-letter {
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          font-size: 44px;
          font-weight: 700;
          line-height: 0.9;
          float: left;
          padding-right: 8px;
          padding-top: 4px;
          color: ${OTTO_RED};
          letter-spacing: -1.5px;
        }
      `}</style>
    </article>
  );
}
