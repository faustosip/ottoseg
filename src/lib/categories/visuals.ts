export type CategoryVisual = { emoji: string; color: string };

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  politica: { emoji: "⚖", color: "#d62828" },
  seguridad: { emoji: "🛡", color: "#0e0e10" },
  economia: { emoji: "📈", color: "#0a7d3d" },
  internacional: { emoji: "🌎", color: "#8e44ad" },
  deportes: { emoji: "⚽", color: "#e67e22" },
  cultura: { emoji: "🎭", color: "#16a085" },
  ambiente: { emoji: "🌱", color: "#65a30d" },
  sociedad: { emoji: "👥", color: "#1d4ed8" },
  vial: { emoji: "🚦", color: "#b06b00" },
  ultima_hora: { emoji: "⚡", color: "#d62828" },
};

const FALLBACK: CategoryVisual = { emoji: "📰", color: "#6c6c72" };

export function visualFor(slug: string): CategoryVisual {
  return CATEGORY_VISUALS[slug.toLowerCase()] ?? FALLBACK;
}
