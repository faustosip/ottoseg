/**
 * Configuración del Diseño Clásico
 * Colores y estilos extraídos del ejemplo.html (Canva)
 */

export const CLASSIC_COLORS = {
  // Colores principales
  newsTitle: "rgb(0, 74, 173)", // #004AAD - Azul oscuro para títulos de noticias
  link: "rgb(26, 98, 255)", // #1A62FF - Azul para links "Leer más"
  text: "rgb(0, 0, 0)", // #000000 - Negro para texto principal
  separator: "rgb(201, 201, 201)", // #C9C9C9 - Gris para líneas separadoras
  background: "rgb(255, 255, 255)", // #FFFFFF - Blanco para fondo
} as const;

export const CLASSIC_TYPOGRAPHY = {
  // Títulos principales
  mainTitle: {
    fontSize: "27.6px",
    lineHeight: "38px",
    fontWeight: 700,
    fontFamily: "var(--font-montserrat)",
  },

  // Fecha
  date: {
    fontSize: "22.8px",
    lineHeight: "31px",
    fontWeight: 400,
    fontFamily: "var(--font-open-sans)",
  },

  // Título de categoría (1. Economía)
  categoryTitle: {
    fontSize: "44px",
    lineHeight: "61px",
    fontWeight: 700,
    fontFamily: "var(--font-montserrat)",
  },

  // Título de noticia
  newsTitle: {
    fontSize: "42.7px",
    lineHeight: "59px",
    fontWeight: 700,
    fontFamily: "var(--font-open-sans)",
  },

  // Contenido/Resumen
  newsContent: {
    fontSize: "37.3px",
    lineHeight: "52px",
    fontWeight: 400,
    fontFamily: "var(--font-open-sans)",
  },

  // Link "Leer más"
  readMoreLink: {
    fontSize: "37.3px",
    lineHeight: "52px",
    fontWeight: 700,
    fontFamily: "var(--font-open-sans)",
  },
} as const;

export const CLASSIC_LAYOUT = {
  // Dimensiones
  width: 1024,
  headerHeight: 484.525,

  // Espaciado
  padding: {
    section: 102,
    content: 31,
  },

  // Imágenes
  newsImage: {
    width: 418,
    height: 258,
  },

  // Separadores
  separator: {
    width: 962,
    height: 3,
    color: CLASSIC_COLORS.separator,
  },
} as const;
