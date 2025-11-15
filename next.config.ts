import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
