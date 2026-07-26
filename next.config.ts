import type { NextConfig } from "next";

// CSP de arranque: permite Supabase (auth/storage/api) y assets propios.
// Ajustar cuando se sume Cloudinary/otro CDN de imágenes en Fase 2.
// 'unsafe-eval' solo en desarrollo: Next/React lo necesitan para Fast Refresh,
// nunca se usa en el build de producción.
const scriptSrc =
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

const contentSecurityPolicy = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "media-src 'self' blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  // sharp usa un binario nativo — no debe bundlearse con webpack, tiene que
  // resolverse como dependencia normal de Node en el runtime del server.
  serverExternalPackages: ["sharp"],
  experimental: {
    // Next.js limita el body de una Server Action a 1MB por default — las
    // fotos de catálogo/showcase/banners van directo como FormData a un
    // Server Action (uploadToBucket), y una foto de celular sin comprimir
    // pesa varios MB (el propio límite de validación en
    // lib/supabase/storage.ts permite hasta 8MB de imagen y 50MB de video).
    // Sin este límite ampliado, CUALQUIER subida de foto/video fallaba con
    // 413 "Body exceeded 1 MB limit" antes de llegar siquiera al pipeline
    // de compresión.
    serverActions: {
      bodySizeLimit: "60mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
