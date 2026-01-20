/**
 * Email Service
 *
 * Nodemailer-based email sending service for newsletter distribution
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// SMTP configuration from environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
};

const SMTP_FROM = process.env.SMTP_FROM || "Otto Seguridad <noticias@ottoseguridad.com>";

// Singleton transporter
let transporter: Transporter | null = null;

/**
 * Get or create the email transporter
 */
function getTransporter(): Transporter {
  if (!transporter) {
    if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
      throw new Error("SMTP credentials not configured. Set SMTP_USER and SMTP_PASS environment variables.");
    }

    transporter = nodemailer.createTransport(SMTP_CONFIG);
  }

  return transporter;
}

/**
 * Verify SMTP connection
 */
export async function verifyConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    return true;
  } catch (error) {
    console.error("SMTP connection error:", error);
    return false;
  }
}

/**
 * Send a single email
 */
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const transport = getTransporter();

    await transport.sendMail({
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return true;
  } catch (error) {
    console.error(`Error sending email to ${options.to}:`, error);
    return false;
  }
}

/**
 * Send emails to multiple recipients
 * Returns count of successful sends
 */
export async function sendBulkEmail(
  recipients: Array<{ email: string; name?: string | null }>,
  subject: string,
  html: string,
  text?: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Verify connection first
  const isConnected = await verifyConnection();
  if (!isConnected) {
    return {
      sent: 0,
      failed: recipients.length,
      errors: ["SMTP connection failed"],
    };
  }

  // Send emails one by one (to avoid rate limiting and allow personalization)
  for (const recipient of recipients) {
    try {
      const success = await sendEmail({
        to: recipient.email,
        subject,
        html,
        text,
      });

      if (success) {
        sent++;
      } else {
        failed++;
        errors.push(`Failed to send to ${recipient.email}`);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      failed++;
      errors.push(`Error with ${recipient.email}: ${(error as Error).message}`);
    }
  }

  return { sent, failed, errors };
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!(SMTP_CONFIG.auth.user && SMTP_CONFIG.auth.pass);
}
