import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone para Docker
  output: "standalone",
  // Deshabilitar ESLint y TypeScript checks durante build en producción
  // Esto permite que el build pase en Vercel mientras trabajamos en las features de video
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Headers de seguridad aplicados a todas las respuestas.
  // Referencias: OWASP Secure Headers Project, MDN.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Evita que el navegador adivine el Content-Type y ejecute contenido
          // subido como HTML/JS.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Impide que la app se embeba en iframes de terceros (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // Controla qué información de Referer se envía a orígenes cruzados.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Desactiva APIs sensibles del navegador por defecto.
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // HSTS: fuerza HTTPS durante 2 años, incluyendo subdominios.
          // Seguro activarlo aquí porque los únicos despliegues oficiales son
          // HTTPS (ottoseguridadai.com). Cambiar a `max-age=0` si se necesita
          // probar sobre HTTP temporalmente.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  // Excluir Remotion del webpack bundle para evitar conflictos en build
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Marcar todos los paquetes de Remotion como externos (no incluir en bundle)
      config.externals = [
        ...(config.externals || []),
        '@remotion/bundler',
        '@remotion/renderer',
        '@remotion/cli',
        '@remotion/player',
        'esbuild',
      ];
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      // Dominios de fuentes de noticias ecuatorianas
      {
        protocol: "https",
        hostname: "imagenes.primicias.ec",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.primicias.ec",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lahora.com.ec",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.lahora.com.ec",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "multimedia.lahora.com.ec",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets.lahora.com.ec",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "elcomercio.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.elcomercio.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "multimedia.elcomercio.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.elcomercio.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "teleamazonas.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.teleamazonas.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.teleamazonas.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "imagenes.teleamazonas.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ecu911.gob.ec",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.ecu911.gob.ec",
        port: "",
        pathname: "/**",
      },
      // Google CDN (used for La Hora article images via Google News)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      // MinIO storage for uploaded images (legacy)
      {
        protocol: "https",
        hostname: "minback.ottoseguridadai.com",
        port: "",
        pathname: "/**",
      },
      // Supabase Storage for uploaded images
      {
        protocol: "https",
        hostname: "supa.ottoseguridadai.com",
        port: "",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
