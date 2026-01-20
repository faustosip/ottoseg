/**
 * Bulletin Email Template
 *
 * Generates HTML email content for the daily news bulletin
 */

import type { Bulletin } from "@/lib/schema";

// Category configuration
const CATEGORIES = [
  { key: "economia" as const, name: "Economía", emoji: "💰" },
  { key: "politica" as const, name: "Política", emoji: "🏛️" },
  { key: "sociedad" as const, name: "Sociedad", emoji: "👥" },
  { key: "seguridad" as const, name: "Seguridad", emoji: "🛡️" },
  { key: "internacional" as const, name: "Internacional", emoji: "🌍" },
  { key: "vial" as const, name: "Vial", emoji: "🚗" },
];

/**
 * Format date for email display
 */
function formatDate(date: Date): string {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} de ${monthName} de ${year}`;
}

/**
 * Generate HTML email content for a bulletin
 */
export function generateBulletinEmail(
  bulletin: Bulletin,
  options?: {
    webViewUrl?: string;
    unsubscribeUrl?: string;
  }
): { html: string; text: string; subject: string } {
  const formattedDate = formatDate(bulletin.date);
  const subject = `Resumen Diario de Noticias - ${formattedDate}`;

  // Build category sections
  const categorySections = CATEGORIES.map((cat, index) => {
    const content = bulletin[cat.key];
    if (!content) return "";

    return `
      <tr>
        <td style="padding: 20px 30px;">
          <h2 style="color: #004aad; font-size: 20px; margin: 0 0 15px 0; border-bottom: 2px solid #004aad; padding-bottom: 8px;">
            ${index + 1}. ${cat.emoji} ${cat.name}
          </h2>
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">
            ${content}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 30px;">
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 0;" />
        </td>
      </tr>
    `;
  })
    .filter(Boolean)
    .join("");

  // Build HTML email
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
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px;">
        <!-- Main Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #004aad 0%, #1a62ff 100%); border-radius: 8px 8px 0 0; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 10px 0; font-weight: bold;">
                Resumen Diario de Noticias
              </h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">
                ${formattedDate}
              </p>
            </td>
          </tr>

          <!-- Introduction -->
          <tr>
            <td style="padding: 25px 30px; background-color: #f8fafc;">
              <p style="color: #666666; font-size: 15px; line-height: 1.5; margin: 0; text-align: center;">
                Buenos días. Aquí está tu resumen de noticias del día.
              </p>
            </td>
          </tr>

          <!-- Category Sections -->
          ${categorySections}

          <!-- Road Map Link (if available) -->
          ${
            bulletin.roadClosureMapUrl
              ? `
          <tr>
            <td style="padding: 20px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="color: #1e40af; font-size: 14px; margin: 0 0 10px 0;">
                      🗺️ Consulta el mapa de cierres viales:
                    </p>
                    <a href="${bulletin.roadClosureMapUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: bold;">
                      Ver Mapa de Rutas
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Web View Link -->
          ${
            options?.webViewUrl
              ? `
          <tr>
            <td style="padding: 20px 30px; text-align: center;">
              <a href="${options.webViewUrl}" style="color: #004aad; font-size: 14px; text-decoration: underline;">
                Ver este boletín en el navegador →
              </a>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-radius: 0 0 8px 8px; padding: 25px 30px; text-align: center;">
              <p style="color: #666666; font-size: 12px; margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} Otto Seguridad. Todos los derechos reservados.
              </p>
              ${
                options?.unsubscribeUrl
                  ? `
              <p style="margin: 0;">
                <a href="${options.unsubscribeUrl}" style="color: #999999; font-size: 11px; text-decoration: underline;">
                  Cancelar suscripción
                </a>
              </p>
              `
                  : ""
              }
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Build plain text version
  const textSections = CATEGORIES.map((cat, index) => {
    const content = bulletin[cat.key];
    if (!content) return "";
    return `
${index + 1}. ${cat.name}
${"=".repeat(40)}
${content}
    `.trim();
  })
    .filter(Boolean)
    .join("\n\n");

  const text = `
RESUMEN DIARIO DE NOTICIAS
${formattedDate}

Buenos días. Aquí está tu resumen de noticias del día.

${textSections}

${bulletin.roadClosureMapUrl ? `\n🗺️ Mapa de cierres viales: ${bulletin.roadClosureMapUrl}\n` : ""}
---
© ${new Date().getFullYear()} Otto Seguridad
${options?.webViewUrl ? `\nVer en el navegador: ${options.webViewUrl}` : ""}
${options?.unsubscribeUrl ? `\nCancelar suscripción: ${options.unsubscribeUrl}` : ""}
  `.trim();

  return { html, text, subject };
}
