/**
 * Classic Bulletin Layout V2
 * Réplica exacta del diseño de ejemplo.html (Canva)
 *
 * Colores exactos:
 * - Título noticias: rgb(0, 74, 173) #004AAD
 * - Links "Leer más": rgb(26, 98, 255) #1A62FF
 * - Texto: rgb(0, 0, 0) #000000
 * - Líneas: rgb(201, 201, 201) #C9C9C9
 * - Fondo: rgb(255, 255, 255) #FFFFFF
 */

import Image from "next/image";
import type { ClassifiedNews, ClassifiedArticle } from "@/lib/news/classifier";

export interface ClassicBulletinV2Props {
  date: Date;
  classifiedData: ClassifiedNews;
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

export function ClassicBulletinV2({
  date,
  classifiedData,
}: ClassicBulletinV2Props) {
  // Formatear fecha
  const formattedDate = new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Obtener categorías con noticias
  const categoriesWithNews = Object.entries(classifiedData).filter(
    ([, news]) => news.length > 0
  );

  // Función para limpiar contenido (remover líneas entrecortadas y otros artefactos)
  const cleanContent = (content: string): string => {
    return content
      .replace(/^-{3,}\s*/gm, "") // Remover líneas que solo tienen guiones al inicio
      .replace(/\s*-{3,}\s*$/gm, "") // Remover líneas que solo tienen guiones al final
      .replace(/\n\s*-{10,}\s*\n/g, "\n") // Remover líneas de guiones entre párrafos
      .trim();
  };

  return (
    <div
      className="mx-auto bg-white font-open-sans"
      style={{
        width: "1024px",
        minHeight: "100vh",
      }}
    >
      {/* Header Section */}
      <section
        style={{
          width: "1024px",
          backgroundColor: "rgb(255, 255, 255)",
        }}
      >
        {/* Banner image */}
        <div style={{ width: "1024px" }}>
          <Image
            src="/banner.png"
            alt="Resumen Diario de Noticias"
            width={1024}
            height={458}
            className="w-full h-auto"
            priority
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement!.style.background =
                "linear-gradient(135deg, #8B0000 0%, #DC143C 100%)";
              e.currentTarget.parentElement!.style.height = "200px";
            }}
          />
        </div>

        {/* Título y fecha */}
        <div style={{ padding: "40px 80px 20px" }}>
          <h1
            className="text-center font-montserrat"
            style={{
              fontSize: "28px",
              lineHeight: "38px",
              fontWeight: 700,
              color: "rgb(0, 0, 0)",
            }}
          >
            RESUMEN DIARIO DE NOTICIAS
          </h1>

          <p
            className="text-center"
            style={{
              fontSize: "22px",
              lineHeight: "32px",
              fontWeight: 400,
              color: "rgb(0, 0, 0)",
              marginTop: "16px",
            }}
          >
            {capitalizedDate}
          </p>
        </div>

        {/* Líneas separadoras */}
        <div
          style={{
            width: "952px",
            height: "2px",
            margin: "12px auto 0",
            backgroundColor: "rgb(201, 201, 201)",
          }}
        />
        <div
          style={{
            width: "962px",
            height: "2px",
            margin: "24px auto 0",
            backgroundColor: "rgb(201, 201, 201)",
          }}
        />
      </section>

      {/* News Sections */}
      {categoriesWithNews.map(([category, news], categoryIndex) => (
        <section
          key={category}
          className="relative"
          style={{
            width: "1024px",
            minHeight: "1000px",
            backgroundColor: "rgb(255, 255, 255)",
            paddingTop: "102px",
            paddingBottom: "102px",
          }}
        >
          {/* Título de categoría (1. Economía) */}
          <div
            className="font-montserrat"
            style={{
              marginLeft: "81px",
              marginBottom: "50px",
            }}
          >
            <h2
              style={{
                fontSize: "44px",
                lineHeight: "61px",
                fontWeight: 700,
                color: "rgb(0, 0, 0)",
                textDecoration: "underline",
                textDecorationColor: "rgb(0, 0, 0)",
              }}
            >
              {categoryIndex + 1}. {categoryNames[category]}
            </h2>
          </div>

          {/* Noticias de la categoría */}
          <div className="space-y-24">
            {news.map((article: ClassifiedArticle, index: number) => (
              <div
                key={`${category}-${index}`}
                className="relative"
                style={{
                  marginLeft: "31px",
                  marginRight: "31px",
                }}
              >
                {/* Imagen arriba (layout vertical) */}
                {article.imageUrl && (
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{
                      width: "100%",
                      maxWidth: "962px",
                      height: "400px",
                      marginBottom: "30px",
                      backgroundColor: "rgb(245, 245, 245)",
                    }}
                  >
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      width={962}
                      height={400}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.parentElement!.style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Título de la noticia */}
                <div
                  style={{
                    maxWidth: "962px",
                    marginBottom: "20px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "38px",
                      lineHeight: "48px",
                      fontWeight: 700,
                      color: "rgb(0, 74, 173)",
                      letterSpacing: "0em",
                    }}
                  >
                    {article.title}
                  </h3>
                </div>

                {/* Contenido/Resumen */}
                <div
                  style={{
                    maxWidth: "962px",
                    marginTop: "20px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "18px",
                      lineHeight: "28px",
                      fontWeight: 400,
                      color: "rgb(0, 0, 0)",
                      letterSpacing: "0em",
                      marginBottom: "20px",
                    }}
                  >
                    {cleanContent(article.content)}
                  </p>

                  {/* Link "Leer más" */}
                  {article.url && (
                    <p style={{ marginTop: "20px" }}>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "18px",
                          lineHeight: "24px",
                          fontWeight: 700,
                          color: "rgb(26, 98, 255)",
                          textDecoration: "underline",
                          textDecorationColor: "rgb(26, 98, 255)",
                        }}
                      >
                        Leer más →
                      </a>
                    </p>
                  )}
                </div>

                {/* Separador entre noticias (si no es la última) */}
                {index < news.length - 1 && (
                  <div
                    style={{
                      width: "962px",
                      height: "3px",
                      backgroundColor: "rgb(201, 201, 201)",
                      marginTop: "80px",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Separadores al final de cada sección (si no es la última categoría) */}
          {categoryIndex < categoriesWithNews.length - 1 && (
            <>
              <div
                className="absolute"
                style={{
                  width: "962px",
                  height: "3px",
                  bottom: "27px",
                  left: "31px",
                  backgroundColor: "rgb(201, 201, 201)",
                }}
              />
              <div
                className="absolute"
                style={{
                  width: "962px",
                  height: "3px",
                  bottom: 0,
                  left: "31px",
                  backgroundColor: "rgb(201, 201, 201)",
                }}
              />
            </>
          )}
        </section>
      ))}
    </div>
  );
}
