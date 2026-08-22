import postgres from 'postgres';

// Leer la URL de conexión desde las variables de entorno (runtime primero, buildtime después)
const connectionString = process.env.DATABASE_URL || import.meta.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL no está configurada. Defina la variable de entorno antes de iniciar la aplicación.');
}

// Inicializar el cliente SQL singleton
// En desarrollo, usamos una conexión global para evitar levantar múltiples conexiones al recargar Astro (hot module reloading)
const globalForSql = globalThis as unknown as { sql: postgres.Sql };

export const sql = globalForSql.sql || postgres(connectionString, {
  max: 10, // Límite del pool de conexiones para entornos de producción/móviles
  idle_timeout: 20, // Cerrar conexiones inactivas tras 20 segundos
  connect_timeout: 10, // Tiempo máximo de espera para conectar
});

if (import.meta.env.DEV) {
  globalForSql.sql = sql;
}
