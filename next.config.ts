/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Configuración para ignorar errores en build (Ya la tenías)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 2. NUEVA CONFIGURACIÓN DE IMÁGENES
  images: {
    // Permitir SVGs (DiceBear usa SVGs)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    // Lista blanca de dominios externos
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**', // Permitir cualquier ruta dentro de este dominio
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**', // Permitir cualquier ruta dentro de este dominio
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;