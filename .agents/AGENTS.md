# RunaFoto - Reglas de Proyecto y Guía de Levantamiento Estratégico (v10)

Este documento sirve como dato maestro y memoria persistente para el agente de desarrollo en el espacio de trabajo de Descubrimiento de RunaFoto.

---

## 1. Gestión de Infraestructura y Base de Datos

### Encendido del Entorno Docker
La base de datos PostgreSQL se ejecuta dentro de un contenedor. Si Docker Desktop no está iniciado en la máquina Windows host, debe arrancarse manualmente:
1. **Ejecutar el backend de Docker**:
   ```powershell
   Start-Process "C:\Users\GRUPO RUNAFOTO\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
   ```
2. **Iniciar o verificar WSL**:
   Asegurar que la máquina virtual `docker-desktop` esté corriendo:
   ```powershell
   wsl -d docker-desktop -- echo "WSL iniciado"
   ```
3. **Levantar Contenedores**:
   ```powershell
   docker-compose up -d
   ```

### Limpieza y Reinicio de Base de Datos ("Desde Cero")
Para limpiar por completo los datos y restaurar el sistema a un estado virgen con la v10 del diagnóstico, se debe realizar un reset total. 
Se ha establecido un flujo estándar de limpieza en el cual se eliminan todas las tablas con `DROP TABLE ... CASCADE` para evitar conflictos de claves foráneas y se recrean.

Ejecutar las sentencias SQL en el siguiente orden:
1. **Drop tables**:
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
2. **Aplicar Esquema**: Cargar [schema.sql](file:///c:/RUNAFOTO/DESCUBRIMIENTO/schema.sql)
3. **Cargar Semilla**: Cargar [seed.sql](file:///c:/RUNAFOTO/DESCUBRIMIENTO/seed.sql)

---

## 2. Definición Estratégica (v10)

Toda la base del levantamiento se organiza bajo el siguiente esquema:

### A. Las 6 Dimensiones de Análisis
Se definieron 6 dimensiones (fusión de modelo de negocio y crecimiento estratégico + separación de dato maestro y herramientas específicas):

| ID en Base de Datos | Código | Nombre |
|---|---|---|
| `negocio_crecimiento` | D1 | Negocio y Crecimiento |
| `comercial` | D2 | Comercial |
| `operaciones` | D3 | Operaciones |
| `informacion` | D4 | Información |
| `organizacion` | D5 | Organización |
| `tecnologia_automatizacion` | D6 | Tecnología y Automatización |

### B. Los 7 Roles / Cuestionarios Evaluados
Cada destinatario tiene su cuestionario específico asignado:

| Persona/Grupo | ID de Cuestionario | Token Seguro | Tipo de Sujeto |
|---|---|---|---|
| **Douglas** (Dirección) | `c1111111-1111-1111-1111-111111111111` | `token-douglas-dir` | INDIVIDUAL |
| **Betty** (Dir. y Admin) | `c2222222-2222-2222-2222-222222222222` | `token-betty-dir` | INDIVIDUAL |
| **Karla** (Académico/Finanzas) | `c3333333-3333-3333-3333-333333333333` | `token-karla-acad` | INDIVIDUAL |
| **Jenne** (Operativo Trujillo) | `c4444444-4444-4444-4444-444444444444` | `token-jenne-coor` | INDIVIDUAL |
| **Josefh** (Operativo Lima) | `c7777777-7777-7777-7777-777777777777` | `token-josefh-coor` | INDIVIDUAL |
| **Producción** (Equipo técnico) | `c5555555-5555-5555-5555-555555555555` | `token-produccion-grupo`| GRUPAL (Muestra: 5) |
| **Yeri** (Contabilidad) | `c6666666-6666-6666-6666-666666666666` | `token-yeri-cont` | INDIVIDUAL |

---

## 3. Acceso Administrativo

* **URL de la Consola**: `http://localhost:4321/administrador`
* **Email Administrador**: `maycol.ac@gmail.com`
* **Contraseña**: `admin123`

---

## 4. Ejecución y Desarrollo Local

### Servidor de Desarrollo Astro
Por regla del proyecto, el servidor de desarrollo se debe levantar en segundo plano. Dado que PowerShell en el host tiene políticas de restricción de scripts activas, se debe anteponer `cmd /c` para invocar `pnpm`:
* **Iniciar servidor**:
  ```powershell
  cmd /c pnpm astro dev --background
  ```
* **Estado del servidor**:
  ```powershell
  cmd /c pnpm astro dev status
  ```
* **Logs del servidor**:
  ```powershell
  cmd /c pnpm astro dev logs
  ```
* **Puerto Principal**: `http://localhost:4321/` (servido de forma estable por el contenedor Docker en ejecución). Si se lanza en local de forma redundante, Astro se moverá dinámicamente al puerto `4322`.
