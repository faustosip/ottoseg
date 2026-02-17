export const AVAILABLE_MENUS = [
  { slug: "boletines", label: "Boletines", href: "/dashboard/bulletin" },
  { slug: "fuentes", label: "Fuentes", href: "/dashboard/settings/sources" },
  { slug: "suscriptores", label: "Suscriptores", href: "/dashboard/subscribers" },
  { slug: "categorias", label: "Categorías", href: "/dashboard/settings/categories" },
  { slug: "usuarios", label: "Usuarios", href: "/dashboard/settings/users" },
  { slug: "dashboard", label: "Dashboard", href: "/dashboard" },
] as const;

export type MenuSlug = (typeof AVAILABLE_MENUS)[number]["slug"];
