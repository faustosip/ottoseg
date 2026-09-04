/**
 * Email Service
 *
 * Envío de correos vía Resend (https://resend.com) para la distribución
 * del boletín a suscriptores.
 *
 * Variables de entorno:
 *   RESEND_API_KEY - clave API de Resend (permiso "Sending access")
 *   EMAIL_FROM     - remitente, ej. "COPSE <copse@ottoseguridad.com.ec>"
 *                    (el dominio debe estar verificado en Resend)
 */

import { Resend } from "resend";
import type { ErrorResponse } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  process.env.SMTP_FROM || // compatibilidad con la configuración anterior
  "Otto Seguridad <noticias@ottoseguridad.com>";

/** Intentos máximos por correo (solo ante errores transitorios: 429 / 5xx) */
const MAX_ATTEMPTS = 3;

// Cliente singleton
let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    if (!RESEND_API_KEY) {
      throw new Error(
        "Resend no configurado. Define la variable de entorno RESEND_API_KEY."
      );
    }
    client = new Resend(RESEND_API_KEY);
  }
  return client;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Errores que vale la pena reintentar: límite de tasa (429) y fallos del
 * servidor (5xx). Errores de validación, API key o dominio no verificado
 * no se reintentan porque van a fallar igual.
 */
function isRetryable(error: ErrorResponse): boolean {
  if (error.statusCode === 429) return true;
  if (error.statusCode !== null && error.statusCode >= 500) return true;
  return (
    error.name === "rate_limit_exceeded" ||
    error.name === "application_error" ||
    error.name === "internal_server_error"
  );
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /**
   * Clave de idempotencia: si se reintenta la misma petición, Resend no
   * envía el correo dos veces. Debe ser única por envío (ej. trackingId).
   */
  idempotencyKey?: string;
}

export type SendEmailResult =
  | { success: true; id: string }
  | { success: false; error: string };

/**
 * Envía un correo individual.
 *
 * Nunca lanza: devuelve `{ success: false, error }` con el motivo real
 * (p. ej. "validation_error: The ottoseguridad.com.ec domain is not verified")
 * para que quien llama pueda registrarlo en la base de datos.
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  let resend: Resend;
  try {
    resend = getClient();
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }

  let lastError = "Error desconocido";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await resend.emails.send(
        {
          from: EMAIL_FROM,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        },
        options.idempotencyKey
          ? { idempotencyKey: options.idempotencyKey }
          : undefined
      );

      if (data) {
        return { success: true, id: data.id };
      }

      if (!error) {
        lastError = "Respuesta vacía de Resend";
        break;
      }

      lastError = `${error.name}: ${error.message}`;
      if (!isRetryable(error)) break;
    } catch (error) {
      // Error de red o excepción inesperada del SDK
      lastError = (error as Error).message;
    }

    if (attempt < MAX_ATTEMPTS) {
      // Backoff exponencial: 1s, 2s
      await delay(1000 * 2 ** (attempt - 1));
    }
  }

  console.error(`Error sending email to ${options.to}: ${lastError}`);
  return { success: false, error: lastError };
}

/**
 * Indica si el servicio de email está configurado
 */
export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY;
}
