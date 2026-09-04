/**
 * Envía el boletín (hoy, o el id indicado) a UN destinatario vía Resend.
 * Sin tracking ni registro en email_sends (igual que el email de prueba).
 * Uso: POSTGRES_URL=... tsx send-bulletin-to.ts <email> [bulletinId]
 */
import { getTodayBulletin, getBulletinById } from "@/lib/db/queries/bulletins";
import { generateBulletinEmail } from "@/lib/email/templates/bulletin";
import { sendEmail, isEmailConfigured } from "@/lib/email";

setTimeout(() => { console.error("TIMEOUT (60s)"); process.exit(2); }, 60000);

async function main() {
  const [to, bulletinId] = process.argv.slice(2);
  if (!to) throw new Error("Falta el email destinatario");
  if (!isEmailConfigured()) throw new Error("RESEND_API_KEY no configurada");

  const bulletin = bulletinId ? await getBulletinById(bulletinId) : await getTodayBulletin();
  if (!bulletin) throw new Error("No se encontró el boletín");
  const okStatus = ["ready", "authorized", "published"];
  if (!okStatus.includes(bulletin.status)) {
    throw new Error(`El boletín ${bulletin.id} está en estado "${bulletin.status}" (se requiere ready/authorized/published). No se envió.`);
  }

  const appUrl = process.env.PUBLIC_APP_URL || "https://ottoseguridadai.com";
  const { html, text, subject } = generateBulletinEmail(bulletin, {
    webViewUrl: `${appUrl}/bulletin/${bulletin.id}`,
  });

  console.log(`Boletín: ${bulletin.id} | fecha ${bulletin.date.toISOString()} | estado ${bulletin.status} | ${bulletin.totalNews} noticias`);
  console.log(`Asunto: ${subject}`);
  console.log(`Para: ${to} | HTML ${html.length} chars`);

  const result = await sendEmail({ to, subject, html, text });
  if (!result.success) throw new Error(`Resend rechazó el envío: ${result.error}`);
  console.log(`✅ Enviado. Resend id: ${result.id}`);
  process.exit(0);
}
main().catch((e) => { console.error("❌", e.message); process.exit(1); });
