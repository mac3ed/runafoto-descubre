FROM node:22-alpine

# Instalar pnpm 11 específicamente
RUN npm install -g pnpm@11.9.0

WORKDIR /app

# Copiar manifiestos
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar dependencias con pnpm congelado
RUN pnpm install --frozen-lockfile

# Copiar el código y script de verificación
COPY . .

# Ejecutar la verificación de seguridad en la cadena de suministro
RUN node verify-package-age.js

# Construir la aplicación Astro para producción
RUN pnpm run build

# Exponer puerto de producción
EXPOSE 4321

# Comando para ejecutar Astro en modo producción standalone
CMD ["node", "./dist/server/entry.mjs"]
