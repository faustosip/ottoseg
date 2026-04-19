import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./db"

const isProduction = process.env.NODE_ENV === "production"
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// En producción solo confiamos en el origen público configurado.
// En desarrollo añadimos localhost para poder ejecutar la app localmente.
const trustedOrigins = isProduction
  ? [appUrl]
  : Array.from(new Set(["http://localhost:3000", appUrl]))

// `BETTER_AUTH_SECRET` es obligatorio: BetterAuth firma cookies/CSRF tokens
// con él, y en producción un fallback implícito sería un riesgo crítico.
// Fail-fast si falta o si quedó el placeholder del Dockerfile.
const BUILD_ONLY_PLACEHOLDER = "__BUILD_ONLY_PLACEHOLDER_REFUSE_AT_RUNTIME__"
if (isProduction) {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) {
    throw new Error(
      "BETTER_AUTH_SECRET no está configurado. Genera uno con `openssl rand -hex 32`."
    )
  }
  if (secret === BUILD_ONLY_PLACEHOLDER) {
    throw new Error(
      "BETTER_AUTH_SECRET es el placeholder del build. Configura el secreto real en el entorno de ejecución."
    )
  }
  if (secret.length < 32) {
    throw new Error(
      "BETTER_AUTH_SECRET debe tener al menos 32 caracteres. Regenera con `openssl rand -hex 32`."
    )
  }
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: appUrl,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    // 7 días de vida y refresco diario.
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    // En producción forzamos `secure` (HTTPS) en todas las cookies.
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      httpOnly: true,
      // `lax` es el valor correcto para compatibilidad con el redirect de
      // Google OAuth. `strict` rompería el flujo de inicio de sesión.
      sameSite: "lax",
      secure: isProduction,
    },
  },
  trustedOrigins,
})