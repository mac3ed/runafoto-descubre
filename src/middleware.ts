import { defineMiddleware } from 'astro:middleware';

// ────────────────────────────────────────────────────────────────
// Rate Limiter en memoria (C3)
// Implementación simple sin dependencias externas.
// En producción a escala, reemplazar con Redis o similar.
// ────────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

// Configuración por ruta
const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/administrador/login': { max: 10, windowMs: 60_000 },       // 10 intentos/min en login
  '/api/submit-answers':  { max: 300, windowMs: 60_000 },      // 300 envíos/min (autosave frecuente de respuestas)
  '/api/get-questionnaire': { max: 500, windowMs: 60_000 },    // 500 lecturas/min
};

const DEFAULT_LIMIT = { max: 200, windowMs: 60_000 };          // 200 req/min por defecto

// Limpiar entradas expiradas cada 5 minutos para evitar memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimits) {
    if (entry.resetAt <= now) {
      rateLimits.delete(key);
    }
  }
}, 5 * 60_000);

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, clientAddress } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Obtener la IP real del cliente detrás de proxies (Traefik, Nginx, Hostinger Load Balancer)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || clientAddress || '127.0.0.1');

  // ── Rate Limiting ──
  const config = RATE_LIMITS[pathname] || DEFAULT_LIMIT;
  const key = `${clientIp}:${pathname}`;
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (entry && entry.resetAt > now) {
    entry.count++;
    if (entry.count > config.max) {
      return new Response(
        JSON.stringify({ error: 'Demasiadas solicitudes. Intente de nuevo en un momento.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
          },
        }
      );
    }
  } else {
    rateLimits.set(key, { count: 1, resetAt: now + config.windowMs });
  }

  // ── Ejecutar el handler de la ruta ──
  const response = await next();

  // ── Security Headers (A2) ──
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  if (import.meta.env.PROD) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
});
