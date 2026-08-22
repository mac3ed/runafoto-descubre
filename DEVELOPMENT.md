# Guía de Desarrollo Local y Migración (Cuestionarios RunaFoto v10)

Esta guía sirve como referencia completa para configurar, ejecutar y continuar el desarrollo de este proyecto en cualquier máquina nueva desde cero.

---

## 📋 1. Requisitos Previos en la Nueva PC

Antes de comenzar, asegúrate de tener instalado en el sistema:
1. **Node.js** (Versión `>= 22.12.0` recomendada. Puedes verificar con `node -v`).
2. **Docker Desktop** (Asegúrate de que el backend de WSL2 esté configurado y activo en Windows).
3. **Git** (Opcional, para control de versiones).

---

## 🚀 2. Guía de Inicio Rápido (Paso a Paso)

### Paso A: Encender Docker
El entorno de base de datos PostgreSQL se ejecuta dentro de un contenedor. Si Docker Desktop no está iniciado, arráncalo manualmente:
* **En Windows (PowerShell):**
  ```powershell
  Start-Process "C:\Users\<Tu-Usuario>\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
  ```
  *(Asegúrate de actualizar la ruta con tu nombre de usuario de Windows si difiere).*

### Paso B: Levantar los Contenedores
Abre una terminal en la carpeta raíz del proyecto (`DESCUBRIMIENTO`) y ejecuta:
```powershell
docker-compose up -d
```
Esto levantará dos contenedores:
1. **`runafoto-postgres-db`**: Base de datos Postgres expuesta localmente en el puerto **`5433`**.
2. **`runafoto-astro-app`**: Contenedor de la app web que compila y sirve el proyecto de forma estable en **`http://localhost:4321`**.

### Paso C: Inicializar o Limpiar la Base de Datos (Si es necesario)
Si deseas restaurar la base de datos a un estado limpio ("desde cero") con el esquema estratégico v10, conéctate a la base de datos (puerto `5433`, usuario `runafoto_user`, contraseña `runafoto_secure_password_2026`) y ejecuta las sentencias SQL en el siguiente orden:

1. **Eliminar tablas existentes (Drop Cascade):**
   ```sql
   DROP TABLE IF EXISTS respuesta CASCADE;
   DROP TABLE IF EXISTS asignacion CASCADE;
   DROP TABLE IF EXISTS pregunta CASCADE;
   DROP TABLE IF EXISTS cuestionario CASCADE;
   DROP TABLE IF EXISTS dimension CASCADE;
   DROP TABLE IF EXISTS hito CASCADE;
   DROP TABLE IF EXISTS administrador_sesion CASCADE;
   DROP TABLE IF EXISTS administrador CASCADE;
   ```
2. **Aplicar Esquema:** Cargar y ejecutar el archivo [schema.sql](file:///schema.sql)
3. **Cargar Semillas de Datos:** Cargar y ejecutar el archivo [seed.sql](file:///seed.sql)

### Paso D: Instalar Dependencias Locales (para desarrollo en el host)
Para ejecutar el servidor de desarrollo localmente en tu terminal (fuera de Docker), instala las dependencias:
```powershell
npx pnpm install
```
*(Usamos `npx pnpm` para evitar instalar pnpm de forma global si no está disponible).*

### Paso E: Levantar el Servidor de Desarrollo en el Host
Por regla del proyecto y políticas de restricción de scripts en Windows, se debe usar `cmd /c` para iniciar el servidor Astro en segundo plano:
* **Iniciar servidor:**
  ```powershell
  cmd /c npx pnpm astro dev --background
  ```
* **Verificar estado:**
  ```powershell
  cmd /c npx pnpm astro dev status
  ```
* **Ver logs:**
  ```powershell
  cmd /c npx pnpm astro dev logs
  ```
* **Puerto local:** Dado que el puerto `4321` ya está ocupado por el contenedor de Docker que corre de fondo, Astro se moverá dinámicamente al puerto **`4322`** en tu máquina host (`http://localhost:4322`).

---

## 🛠️ 3. Estructura Estratégica (v10)

### Las 6 Dimensiones de Análisis
Todas las preguntas del diagnóstico están etiquetadas bajo estas dimensiones:
- **`negocio_crecimiento`** (D1): Negocio y Crecimiento
- **`comercial`** (D2): Comercial
- **`operaciones`** (D3): Operaciones
- **`informacion`** (D4): Información
- **`organizacion`** (D5): Organización
- **`tecnologia_automatizacion`** (D6): Tecnología y Automatización

### Los Cuestionarios y Roles Evaluados
Cada persona evaluada tiene asignado un cuestionario específico a través de un token seguro:
- **Douglas** (Gerencia General y Desarrollo de Producto): `c1111111-1111-1111-1111-111111111111`
- **Betty** (Administración General): `c2222222-2222-2222-2222-222222222222`
- **Karla** (Coordinación Académica): `c3333333-3333-3333-3333-333333333333`
- **Jenne** (Coordinación Operativa Norte): `c4444444-4444-4444-4444-444444444444`
- **Josefh** (Coordinación Operativa Lima/Sur): `c7777777-7777-7777-7777-777777777777`
- **Contabilidad** (Yeri): `c6666666-6666-6666-6666-666666666666`
- **Producción** (Equipo Técnico / Grupal): `c5555555-5555-5555-5555-555555555555`

---

## 🔑 4. Credenciales y URLs de Acceso

* **Consola de Administración:**
  - **URL Local (Docker):** `http://localhost:4321/administrador`
  - **URL Local (Host):** `http://localhost:4322/administrador`
  - **Email Administrador:** `maycol.ac@gmail.com`
  - **Contraseña:** `admin123`
* **Acceso a un Cuestionario de Prueba:**
  - Puedes emular el acceso de un evaluado usando la ruta `/q/[token-de-la-persona]`.
  - Ejemplo: `http://localhost:4321/q/token-betty-dir`

---

## 🤖 5. Continuar Desarrollo con Antigravity en la Nueva PC

1. **Copiar Carpeta:** Copia todo el directorio `DESCUBRIMIENTO` a la nueva PC. Las carpetas `.agents/` y los archivos de configuración (`AGENTS.md`) ya contienen las reglas de desarrollo integradas para el agente.
2. **Iniciar Antigravity:** Cuando abras Antigravity en el nuevo entorno, este leerá automáticamente el archivo `.agents/AGENTS.md` (o el de reglas locales) y recordará el esquema v10, las credenciales, el flujo Docker y los comandos de desarrollo locales.
3. **Soporte de Entornos (Híbrido Local/Docker):**
   - El archivo `src/lib/db.ts` está configurado para cargar la base de datos de forma dinámica:
     ```typescript
     const connectionString = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;
     ```
   - Esto permite que la app funcione sin cambios tanto en el host local de tu PC (usando `.env` local y conectándose a `localhost:5433`) como dentro de un contenedor Docker en producción (conectándose directamente al host `db:5432` en el contenedor).

---

## 🔒 6. Seguridad de Cookies (HTTP vs HTTPS)

En el archivo `src/lib/auth.ts`, la cookie de sesión del administrador se configuró con `secure: false` para permitir pruebas en entornos de red locales o mediante accesos por IP directa (sin certificados SSL/HTTPS).
* **En desarrollo local/pruebas por IP:** Dejar `secure: false` es obligatorio para poder iniciar sesión.
* **En producción con Dominio Real (HTTPS):** Si decides configurar un dominio real con certificados SSL (por ejemplo, a través de Traefik), se recomienda volver a activar la seguridad en `src/lib/auth.ts`:
  ```typescript
  secure: import.meta.env.PROD, // Solo transmite cookies sobre HTTPS en producción
  ```

---

## 🧹 7. Script de Limpieza en Producción (cleanup.sh)

En caso de que requieras remover de forma limpia y definitiva este proyecto temporal de un VPS, hemos incluido el script `cleanup.sh` en la raíz del proyecto. Este script:
1. Detiene y elimina los contenedores, redes y volúmenes de base de datos asociados.
2. Elimina las imágenes Docker compiladas para la aplicación web.
3. Borra físicamente los archivos del proyecto en la carpeta del VPS.
