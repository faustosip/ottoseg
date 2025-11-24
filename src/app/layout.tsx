import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Open_Sans, Montserrat, Oswald, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fuentes para diseño clásico de boletines
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["700"],
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  weight: ["700"],
  subsets: ["latin"],
  display: "swap",
});

// Fuente para diseño moderno de boletines
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// NOTA: Si tienes las fuentes custom Canva Sans y Coco Gothic:
// 1. Colócalas en /public/fonts/
// 2. Impórtalas usando localFont
// 3. Agrégalas a las variables del body abajo

export const metadata: Metadata = {
  title: "OttoSeguridad - Resumen Diario de Noticias",
  description:
    "Tu resumen diario de noticias ecuatorianas, generado automáticamente cada mañana. Noticias organizadas en 6 categorías con diseños clásico y moderno.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${openSans.variable} ${montserrat.variable} ${oswald.variable} ${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader />
          {children}
          <SiteFooter />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
