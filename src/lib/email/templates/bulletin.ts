/**
 * Bulletin Email Template - Diseño profesional OttoSeguridad
 *
 * Genera email HTML que coincide con el diseño del boletín público:
 * - Header oscuro con gradiente rojo/gris
 * - Artículos individuales con títulos, imágenes y "Leer más"
 * - Sección "Última Hora"
 * - Video (link al boletín web)
 * - Footer con branding corporativo
 */

import type { Bulletin } from "@/lib/schema";

interface ClassifiedNewsItem {
  title: string;
  content?: string;
  fullContent?: string;
  imageUrl?: string;
  url?: string;
  source?: string;
  category?: string;
}

// Category configuration - matches public view order
const CATEGORIES = [
  { key: "economia", name: "Economía", emoji: "💰" },
  { key: "politica", name: "Política", emoji: "🏛️" },
  { key: "sociedad", name: "Sociedad", emoji: "👥" },
  { key: "seguridad", name: "Seguridad", emoji: "🛡️" },
  { key: "internacional", name: "Internacional", emoji: "🌍" },
  { key: "vial", name: "Vial", emoji: "🚗" },
];

const APP_URL = "https://ottoseguridadai.com";
const LOGO_BUHO = `${APP_URL}/logos/buho-seguridad.png`;
const LOGO_OTTO = `${APP_URL}/logos/otto-logo.png`;
const CONTACT_EMAIL = "informacion2@ottoseguridad.com.ec";

/**
 * Clean text of URLs, hashtags, and promotional content for email display
 */
function cleanEmailText(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/www\.\S+/g, "")
    .replace(/#\w+/g, "")
    .replace(/pic\.twitter\.com\/\S+/g, "")
    .replace(/Más información:\s*/gi, "")
    .replace(/Contenido Patrocinado\s*/gi, "")
    .replace(/(?:siguiente\s+)?enlace:\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Truncate text to approximately N sentences
 */
function truncateEmailText(text: string, maxSentences: number = 5): string {
  const cleaned = cleanEmailText(text);
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length <= maxSentences) return cleaned;
  return sentences.slice(0, maxSentences).join(" ").trim();
}

/**
 * Format date for email display
 */
function formatDate(date: Date): string {
  const days = [
    "Domingo", "Lunes", "Martes", "Miércoles",
    "Jueves", "Viernes", "Sábado",
  ];
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

/**
 * Rewrite a URL for click tracking
 */
function trackUrl(url: string, trackingBaseUrl?: string): string {
  if (!trackingBaseUrl) return url;
  return `${trackingBaseUrl}?url=${encodeURIComponent(url)}`;
}

/**
 * Generate HTML for a single article
 */
function renderArticle(
  article: ClassifiedNewsItem,
  trackingBaseUrl?: string
): string {
  const imageHtml = article.imageUrl
    ? `
              <tr>
                <td style="padding: 0 0 12px 0;">
                  <img src="${article.imageUrl}" alt="${article.title}" width="540" style="width: 100%; max-width: 540px; height: auto; border-radius: 8px; display: block;" />
                </td>
              </tr>`
    : "";

  const cleanTitle = cleanEmailText(article.title);
  const titleHtml = `
              <tr>
                <td style="padding: 0 0 8px 0;">
                  <h3 style="color: #1e3a5f; font-size: 18px; margin: 0; font-weight: bold; line-height: 1.3;">
                    ${cleanTitle}
                  </h3>
                </td>
              </tr>`;

  const displayContent = article.content || article.fullContent;
  const contentHtml = displayContent
    ? `
              <tr>
                <td style="padding: 0 0 10px 0;">
                  <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0;">
                    ${truncateEmailText(displayContent, 5)}
                  </p>
                </td>
              </tr>`
    : "";

  const readMoreHtml = article.url
    ? `
              <tr>
                <td style="padding: 0 0 4px 0;">
                  <a href="${trackUrl(article.url, trackingBaseUrl)}" target="_blank" style="color: #dc2626; font-size: 14px; font-weight: 600; text-decoration: none;">
                    Leer m&aacute;s &rarr;
                  </a>
                </td>
              </tr>`
    : "";

  return `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
              ${imageHtml}
              ${titleHtml}
              ${contentHtml}
              ${readMoreHtml}
            </table>`;
}

/**
 * Generate HTML email content for a bulletin
 */
export function generateBulletinEmail(
  bulletin: Bulletin,
  options?: {
    webViewUrl?: string;
    unsubscribeUrl?: string;
    subscriberName?: string;
    trackingPixelUrl?: string;
    trackingBaseUrl?: string;
    trackingId?: string;
  }
): { html: string; text: string; subject: string } {
  const formattedDate = formatDate(bulletin.date);
  const subject = `Resumen Diario de Noticias - ${formattedDate}`;
  const classifiedNews = bulletin.classifiedNews as Record<string, ClassifiedNewsItem[]> | null;

  const greeting = options?.subscriberName
    ? `Buenos d&iacute;as, ${options.subscriberName}.`
    : "Buenos d&iacute;as.";

  // Última Hora articles
  const ultimaHoraNews = classifiedNews?.ultima_hora || [];
  const hasUltimaHora = ultimaHoraNews.length > 0;

  // Has video
  const hasVideo = !!bulletin.manualVideoUrl;
  const webViewUrl = options?.webViewUrl || `${APP_URL}/bulletin/${bulletin.id}`;

  // Build category sections with individual articles
  let categoryIndex = 0;
  const categorySections = CATEGORIES.map((cat) => {
    // Use individual articles from classifiedNews
    const articles = classifiedNews?.[cat.key];
    const summaryContent = bulletin[cat.key as keyof Bulletin] as string | undefined;

    // Skip if no articles and no summary
    if ((!articles || articles.length === 0) && !summaryContent) return "";

    categoryIndex++;
    const currentIndex = categoryIndex;

    // If we have individual articles, render each one
    let articlesHtml = "";
    if (articles && articles.length > 0) {
      articlesHtml = articles
        .map((article) => renderArticle(article, options?.trackingBaseUrl))
        .join("");
    } else if (summaryContent) {
      // Fallback: use summary text
      articlesHtml = `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
              <tr>
                <td style="padding: 0;">
                  <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0;">
                    ${summaryContent}
                  </p>
                </td>
              </tr>
            </table>`;
    }

    return `
          <!-- Categor&iacute;a: ${cat.name} -->
          <tr>
            <td style="padding: 30px 30px 8px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color: #dc2626; color: #ffffff; width: 36px; height: 36px; border-radius: 50%; text-align: center; vertical-align: middle; font-size: 16px; font-weight: bold;">
                    ${currentIndex}
                  </td>
                  <td style="padding-left: 14px;">
                    <h2 style="color: #111827; font-size: 22px; margin: 0; font-weight: bold;">
                      ${cat.name}
                    </h2>
                  </td>
                </tr>
              </table>
              <div style="height: 2px; background-color: #e5e7eb; margin-top: 12px;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 30px 10px 30px;">
              ${articlesHtml}
            </td>
          </tr>`;
  })
    .filter(Boolean)
    .join("");

  // Última Hora section - group by subcategory
  let ultimaHoraContentHtml = "";
  if (hasUltimaHora) {
    // Build category name lookup from CATEGORIES array
    const catNameMap: Record<string, string> = {};
    for (const c of CATEGORIES) {
      catNameMap[c.key] = c.name;
    }

    // Group articles by subcategory
    const uhGrouped: Record<string, ClassifiedNewsItem[]> = {};
    for (const article of ultimaHoraNews) {
      const key = article.category || "";
      if (!uhGrouped[key]) uhGrouped[key] = [];
      uhGrouped[key].push(article);
    }
    const uhKeys = Object.keys(uhGrouped).sort((a, b) => {
      if (a === "") return 1;
      if (b === "") return -1;
      return (catNameMap[a] || a).localeCompare(catNameMap[b] || b);
    });

    const renderUhArticle = (article: ClassifiedNewsItem) => `
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
                        ${
                          article.imageUrl
                            ? `<tr>
                          <td style="padding: 0 0 10px 0;">
                            <img src="${article.imageUrl}" alt="${article.title}" width="500" style="width: 100%; max-width: 500px; height: auto; border-radius: 6px; display: block;" />
                          </td>
                        </tr>`
                            : ""
                        }
                        <tr>
                          <td style="padding: 0 0 6px 0;">
                            <h4 style="color: #111827; font-size: 16px; margin: 0; font-weight: bold; line-height: 1.3;">
                              ${cleanEmailText(article.title)}
                            </h4>
                          </td>
                        </tr>
                        ${
                          (article.content || article.fullContent)
                            ? `<tr>
                          <td style="padding: 0 0 8px 0;">
                            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0;">
                              ${truncateEmailText(article.content || article.fullContent || "", 4)}
                            </p>
                          </td>
                        </tr>`
                            : ""
                        }
                        ${
                          article.url
                            ? `<tr>
                          <td>
                            <a href="${trackUrl(article.url, options?.trackingBaseUrl)}" target="_blank" style="color: #dc2626; font-size: 13px; font-weight: 600; text-decoration: none;">
                              Leer m&aacute;s &rarr;
                            </a>
                          </td>
                        </tr>`
                            : ""
                        }
                      </table>`;

    const separator = '<table role="presentation" width="100%"><tr><td><hr style="border: none; border-top: 1px solid #f3f4f6; margin: 4px 0 16px 0;" /></td></tr></table>';

    const groupsHtml = uhKeys.map((key) => {
      const articles = uhGrouped[key];
      const label = key ? (catNameMap[key] || key) : "";
      const headerHtml = label
        ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 12px;">
                        <tr>
                          <td style="padding: 8px 0 4px 0; border-bottom: 2px solid #dc2626;">
                            <h3 style="color: #991b1b; font-size: 13px; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                              ${label}
                            </h3>
                          </td>
                        </tr>
                      </table>`
        : "";
      return headerHtml + articles.map(renderUhArticle).join(separator);
    });

    ultimaHoraContentHtml = groupsHtml.join(separator);
  }

  const ultimaHoraHtml = hasUltimaHora
    ? `
          <!-- &Uacute;ltima Hora -->
          <tr>
            <td style="padding: 30px 30px 0 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color: #dc2626; border-radius: 8px 8px 0 0; padding: 14px 20px;">
                    <h2 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: bold;">
                      &#9889; &Uacute;LTIMA HORA
                    </h2>
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px; padding: 20px;">
                    ${ultimaHoraContentHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : "";

  // Video section (link to web view)
  const videoHtml = hasVideo
    ? `
          <tr>
            <td style="padding: 25px 30px 0 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #faf5ff; border-radius: 8px; border: 1px solid #e9d5ff;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="color: #7c3aed; font-size: 16px; margin: 0 0 4px 0; font-weight: 700;">
                      &#9654; VIDEO DEL BOLET&Iacute;N
                    </p>
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 14px 0;">
                      Mira el video resumen del d&iacute;a en el bolet&iacute;n web
                    </p>
                    <a href="${trackUrl(webViewUrl, options?.trackingBaseUrl)}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 10px 28px; border-radius: 6px; font-size: 14px; font-weight: bold;">
                      Ver Video
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : "";

  // Road closure map section
  const roadMapHtml = bulletin.roadClosureMapUrl
    ? `
          <tr>
            <td style="padding: 25px 30px 0 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="color: #1e40af; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
                      &#128506; Mapa de cierres viales
                    </p>
                    <a href="${trackUrl(bulletin.roadClosureMapUrl, options?.trackingBaseUrl)}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: bold;">
                      Ver Mapa de Rutas
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : "";

  // CTA button
  const ctaHtml = `
          <tr>
            <td style="padding: 30px 30px 10px 30px; text-align: center;">
              <a href="${trackUrl(webViewUrl, options?.trackingBaseUrl)}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                Ver Bolet&iacute;n Completo en la Web
              </a>
            </td>
          </tr>`;

  // Tracking pixel
  const trackingPixelHtml = options?.trackingPixelUrl
    ? `<img src="${options.trackingPixelUrl}" width="1" height="1" style="display:none; width:1px; height:1px; border:0;" alt="" />`
    : "";

  // Unsubscribe link
  const unsubscribeHtml = options?.unsubscribeUrl
    ? `<a href="${options.unsubscribeUrl}" style="color: #9ca3af; font-size: 11px; text-decoration: underline;">Cancelar suscripci&oacute;n</a>`
    : "";

  // Build full HTML
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px;">

        <!-- Main Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); max-width: 600px; width: 100%;">

          <!-- Header oscuro (matching public view) -->
          <tr>
            <td style="background: linear-gradient(135deg, #111827 0%, #7f1d1d 100%); border-radius: 12px 12px 0 0; padding: 35px 30px 25px 30px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td style="padding-right: 16px; vertical-align: middle;">
                    <img src="${LOGO_BUHO}" alt="B&uacute;ho" width="60" height="60" style="display: block; width: 60px; height: 60px;" />
                  </td>
                  <td style="vertical-align: middle;">
                    <img src="${LOGO_OTTO}" alt="OttoSeguridad" height="44" style="display: block; height: 44px; width: auto;" />
                  </td>
                </tr>
              </table>
              <h1 style="color: #ffffff; font-size: 26px; margin: 20px 0 0 0; font-weight: bold; letter-spacing: 1px;">
                RESUMEN DIARIO DE NOTICIAS
              </h1>
              <div style="width: 60px; height: 3px; background-color: #dc2626; margin: 14px auto 0 auto; border-radius: 2px;"></div>
              <p style="color: rgba(255,255,255,0.85); font-size: 16px; margin: 14px 0 0 0; font-weight: 300;">
                ${formattedDate}
              </p>
            </td>
          </tr>

          <!-- Saludo -->
          <tr>
            <td style="padding: 25px 30px 10px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0;">
                ${greeting} Aqu&iacute; est&aacute; su resumen de noticias del d&iacute;a.
              </p>
            </td>
          </tr>

          <!-- Video del boletín -->
          ${videoHtml}

          <!-- Categorías con artículos individuales -->
          ${categorySections}

          <!-- Última Hora -->
          ${ultimaHoraHtml}

          <!-- Mapa vial -->
          ${roadMapHtml}

          <!-- CTA -->
          ${ctaHtml}

          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #111827 0%, #000000 100%); border-radius: 0 0 12px 12px; padding: 35px 30px; text-align: center;">
              <img src="${LOGO_BUHO}" alt="OttoSeguridad" width="80" height="80" style="display: inline-block; width: 80px; height: 80px; margin-bottom: 12px;" />
              <br />
              <img src="${LOGO_OTTO}" alt="OTTO Seguridad" height="32" style="display: inline-block; height: 32px; width: auto; margin-bottom: 12px;" />
              <p style="color: #d1d5db; font-size: 14px; margin: 0 0 8px 0; font-weight: 300;">
                Tu seguridad, nuestra prioridad
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px 0;">
                <a href="mailto:${CONTACT_EMAIL}" style="color: #9ca3af; text-decoration: none;">${CONTACT_EMAIL}</a>
              </p>
              <p style="color: #6b7280; font-size: 11px; margin: 14px 0 0 0;">
                &copy; ${new Date().getFullYear()} OttoSeguridad. Todos los derechos reservados.
              </p>
              ${unsubscribeHtml ? `<p style="margin: 8px 0 0 0;">${unsubscribeHtml}</p>` : ""}
            </td>
          </tr>

        </table>

        ${trackingPixelHtml}

      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  // Build plain text version
  const textSections = CATEGORIES.map((cat, index) => {
    const articles = classifiedNews?.[cat.key];
    const summaryContent = bulletin[cat.key as keyof Bulletin] as string | undefined;

    if ((!articles || articles.length === 0) && !summaryContent) return "";

    let sectionText = `${index + 1}. ${cat.name}\n${"=".repeat(40)}`;

    if (articles && articles.length > 0) {
      sectionText += articles
        .map((a) => {
          let articleText = `\n\n${a.title}`;
          if (a.content) articleText += `\n${a.content}`;
          if (a.url) articleText += `\nLeer más: ${a.url}`;
          return articleText;
        })
        .join("");
    } else if (summaryContent) {
      sectionText += `\n${summaryContent}`;
    }

    return sectionText;
  })
    .filter(Boolean)
    .join("\n\n");

  // Última Hora plain text - grouped by subcategory
  let ultimaHoraText = "";
  if (hasUltimaHora) {
    const catNameMap: Record<string, string> = {};
    for (const c of CATEGORIES) {
      catNameMap[c.key] = c.name;
    }
    const uhGrouped: Record<string, ClassifiedNewsItem[]> = {};
    for (const a of ultimaHoraNews) {
      const key = a.category || "";
      if (!uhGrouped[key]) uhGrouped[key] = [];
      uhGrouped[key].push(a);
    }
    const uhKeys = Object.keys(uhGrouped).sort((a, b) => {
      if (a === "") return 1;
      if (b === "") return -1;
      return (catNameMap[a] || a).localeCompare(catNameMap[b] || b);
    });

    ultimaHoraText = `\n\nÚLTIMA HORA\n${"=".repeat(40)}`;
    for (const key of uhKeys) {
      if (key) {
        ultimaHoraText += `\n\n--- ${(catNameMap[key] || key).toUpperCase()} ---`;
      }
      for (const a of uhGrouped[key]) {
        ultimaHoraText += `\n\n${a.title}`;
        if (a.content) ultimaHoraText += `\n${a.content}`;
        if (a.url) ultimaHoraText += `\nLeer más: ${a.url}`;
      }
    }
  }

  const text = `
RESUMEN DIARIO DE NOTICIAS
${formattedDate}

${options?.subscriberName ? `Buenos días, ${options.subscriberName}.` : "Buenos días."} Aquí está su resumen de noticias del día.

${textSections}
${ultimaHoraText}
${bulletin.roadClosureMapUrl ? `\nMapa de cierres viales: ${bulletin.roadClosureMapUrl}\n` : ""}
---
Ver boletín completo: ${webViewUrl}

© ${new Date().getFullYear()} OttoSeguridad
${CONTACT_EMAIL}
${options?.unsubscribeUrl ? `\nCancelar suscripción: ${options.unsubscribeUrl}` : ""}`.trim();

  return { html, text, subject };
}
