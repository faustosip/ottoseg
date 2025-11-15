/**
 * Sistema de Diseño Dual para Boletines
 *
 * Este módulo define las configuraciones de diseño para los dos estilos de boletín:
 * - Clásico: Diseño tradicional familiar para audiencia mayor
 * - Moderno: Diseño web contemporáneo y responsive
 */

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

/**
 * Configuración de layout del diseño
 */
export interface LayoutConfig {
  maxWidth: string;
  containerPadding: string;
  sectionSpacing: string;
}

/**
 * Configuración de tipografía
 */
export interface TypographyConfig {
  fontFamily: {
    heading: string;
    body: string;
  };
  sizes: {
    mainTitle: string;
    sectionTitle: string;
    newsTitle: string;
    body: string;
    date: string;
  };
}

/**
 * Configuración de colores
 */
export interface ColorsConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  link: string;
}

/**
 * Configuración de componentes visuales
 */
export interface ComponentsConfig {
  showSectionNumbers: boolean;
  showImages: boolean;
  imagePosition: 'top' | 'side';
  underlineTitles: boolean;
  showSeparators: boolean;
  roundedCorners: boolean;
}

/**
 * Configuración completa de un diseño
 */
export interface DesignConfig {
  name: 'classic' | 'modern';
  layout: LayoutConfig;
  typography: TypographyConfig;
  colors: ColorsConfig;
  components: ComponentsConfig;
}

// ============================================================================
// COLORES CORPORATIVOS
// ============================================================================

/**
 * Paleta de colores corporativa de OttoSeguridad
 * Estos colores se usan consistentemente en ambos diseños
 */
export const BRAND_COLORS = {
  // Azules corporativos
  primary: '#004aad',        // Azul oscuro
  secondary: '#1a62ff',      // Azul enlace

  // Acentos
  accent: '#c9c9c9',         // Gris separadores (clásico)
  accentModern: '#e5e7eb',   // Gris acentos (moderno)

  // Fondos
  background: '#ffffff',      // Blanco
  backgroundSecondary: '#f9fafb', // Gris muy claro (moderno)
  backgroundTertiary: '#f3f4f6',  // Gris claro (moderno)

  // Textos
  text: '#000000',           // Negro puro (clásico)
  textPrimary: '#111827',    // Negro suave (moderno)
  textSecondary: '#4b5563',  // Gris medio (moderno)
  textTertiary: '#6b7280',   // Gris claro (moderno)

  // Blues para UI moderna
  blue50: '#eff6ff',
  blue600: '#1e40af',
} as const;

// ============================================================================
// CONFIGURACIÓN DISEÑO CLÁSICO
// ============================================================================

/**
 * Diseño Clásico
 *
 * Replica el formato tradicional de boletín impreso digitalizado.
 * Optimizado para audiencia mayor familiarizada con este formato.
 *
 * Características:
 * - Layout lineal vertical
 * - Tipografía grande y legible
 * - Secciones numeradas con títulos subrayados
 * - Separadores horizontales grises
 * - Imágenes centradas
 * - Texto justificado
 */
export const CLASSIC_DESIGN: DesignConfig = {
  name: 'classic',

  layout: {
    maxWidth: '1024px',
    containerPadding: '48px',
    sectionSpacing: '60px',
  },

  typography: {
    fontFamily: {
      // Fuentes principales con fallbacks
      heading: 'var(--font-oswald), "Coco Gothic", "Oswald", system-ui, sans-serif',
      body: 'var(--font-open-sans), "Open Sans", system-ui, sans-serif',
    },
    sizes: {
      mainTitle: '44px',      // "RESUMEN DIARIO DE NOTICIAS"
      sectionTitle: '44px',   // "1. Economía", "2. Política", etc.
      newsTitle: '42px',      // Título de cada noticia
      body: '37px',           // Contenido del resumen
      date: '22px',           // Fecha del boletín
    },
  },

  colors: {
    primary: BRAND_COLORS.primary,
    secondary: BRAND_COLORS.secondary,
    accent: BRAND_COLORS.accent,
    background: BRAND_COLORS.background,
    text: BRAND_COLORS.text,
    link: BRAND_COLORS.secondary,
  },

  components: {
    showSectionNumbers: true,       // "1. Economía", "2. Política"
    showImages: true,                // Imágenes ilustrativas
    imagePosition: 'top',            // Imagen encima del contenido
    underlineTitles: true,           // Títulos de sección subrayados
    showSeparators: true,            // Líneas horizontales grises
    roundedCorners: false,           // Sin border-radius
  },
};

// ============================================================================
// CONFIGURACIÓN DISEÑO MODERNO
// ============================================================================

/**
 * Diseño Moderno
 *
 * Experiencia web contemporánea con diseño responsive.
 * Optimizado para usuarios que prefieren interfaces modernas.
 *
 * Características:
 * - Grid responsive (3→2→1 columnas)
 * - Cards con sombra y hover effects
 * - Gradientes y animaciones suaves
 * - Badges en lugar de números
 * - Tipografía compacta
 * - Border-radius y sombras
 */
export const MODERN_DESIGN: DesignConfig = {
  name: 'modern',

  layout: {
    maxWidth: '1200px',
    containerPadding: '24px',
    sectionSpacing: '48px',
  },

  typography: {
    fontFamily: {
      heading: 'var(--font-inter), "Inter", system-ui, sans-serif',
      body: 'var(--font-inter), "Inter", system-ui, sans-serif',
    },
    sizes: {
      mainTitle: '48px',      // Título principal del header
      sectionTitle: '32px',   // Títulos de categorías
      newsTitle: '28px',      // Títulos de noticias en cards
      body: '16px',           // Contenido de cards
      date: '14px',           // Fecha en header
    },
  },

  colors: {
    primary: BRAND_COLORS.primary,
    secondary: BRAND_COLORS.secondary,
    accent: BRAND_COLORS.accentModern,
    background: BRAND_COLORS.background,
    text: BRAND_COLORS.textPrimary,
    link: BRAND_COLORS.secondary,
  },

  components: {
    showSectionNumbers: false,      // Sin numeración visible
    showImages: true,                // Imágenes en cards
    imagePosition: 'side',           // Imagen al lado del contenido (desktop)
    underlineTitles: false,          // Sin subrayado
    showSeparators: false,           // Sin líneas horizontales
    roundedCorners: true,            // Border-radius en cards e imágenes
  },
};

// ============================================================================
// FUNCIONES HELPER
// ============================================================================

/**
 * Obtiene la configuración de diseño según la versión solicitada
 *
 * @param version - Versión del diseño ('classic' | 'modern')
 * @returns Configuración completa del diseño
 * @throws Error si la versión no es válida
 *
 * @example
 * ```typescript
 * const design = getDesignConfig('classic');
 * console.log(design.typography.sizes.mainTitle); // "44px"
 * ```
 */
export function getDesignConfig(version: 'classic' | 'modern'): DesignConfig {
  switch (version) {
    case 'classic':
      return CLASSIC_DESIGN;
    case 'modern':
      return MODERN_DESIGN;
    default:
      // TypeScript debería prevenir esto, pero por si acaso
      throw new Error(`Invalid design version: ${version}. Must be 'classic' or 'modern'.`);
  }
}

/**
 * Verifica si un valor es una versión de diseño válida
 *
 * @param value - Valor a verificar
 * @returns true si es 'classic' o 'modern'
 */
export function isValidDesignVersion(value: unknown): value is 'classic' | 'modern' {
  return value === 'classic' || value === 'modern';
}

/**
 * Obtiene el nombre formateado del diseño para display
 *
 * @param version - Versión del diseño
 * @returns Nombre legible del diseño
 *
 * @example
 * ```typescript
 * getDesignDisplayName('classic'); // "Diseño Clásico"
 * getDesignDisplayName('modern');  // "Diseño Moderno"
 * ```
 */
export function getDesignDisplayName(version: 'classic' | 'modern'): string {
  const names = {
    classic: 'Diseño Clásico',
    modern: 'Diseño Moderno',
  };
  return names[version];
}

// ============================================================================
// TIPOS EXPORTADOS PARA USO EN COMPONENTES
// ============================================================================

/**
 * Tipo para la versión del diseño
 */
export type DesignVersion = 'classic' | 'modern';

/**
 * Tipo para las posiciones de imagen
 */
export type ImagePosition = 'top' | 'side';

/**
 * Props comunes para componentes que usan el sistema de diseño
 */
export interface DesignAwareProps {
  design?: DesignVersion;
}
