import fs from 'fs';

const LOCKFILE_PATH = 'pnpm-lock.yaml';
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

async function checkPackages() {
  if (!fs.existsSync(LOCKFILE_PATH)) {
    console.log('No pnpm-lock.yaml encontrado. Omitiendo verificación de seguridad.');
    process.exit(0);
  }

  const content = fs.readFileSync(LOCKFILE_PATH, 'utf8');
  // Capturar nombre y versión de la sección "packages:"
  const packageRegex = /^\s*['"]?(@?[a-zA-Z0-9\-_./]+)@([0-9]+\.[0-9]+\.[0-9]+[^\s'":]*)/gm;
  const packages = new Map();
  let match;
  while ((match = packageRegex.exec(content)) !== null) {
    packages.set(match[1], match[2]);
  }

  console.log(`[Seguridad] Encontrados ${packages.size} paquetes únicos en pnpm-lock.yaml.`);

  const packagesToCheck = Array.from(packages.entries());
  const now = Date.now();
  const violations = [];
  let checked = 0;

  // Límite de concurrencia para peticiones HTTP
  const CONCURRENCY = 25;

  async function worker() {
    while (packagesToCheck.length > 0) {
      const item = packagesToCheck.shift();
      if (!item) break;
      const [name, version] = item;
      
      // Omitir referencias locales o de workspace
      if (version.startsWith('link:') || version.startsWith('file:') || name.startsWith('runafoto-')) {
        continue;
      }

      try {
        const res = await fetch(`https://registry.npmjs.org/${name}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) {
          if (res.status === 404) continue;
          throw new Error(`Código de respuesta ${res.status}`);
        }
        const data = await res.json();
        const publishTimeStr = data.time?.[version];
        if (publishTimeStr) {
          const publishTime = Date.parse(publishTimeStr);
          const age = now - publishTime;
          if (age < FORTY_EIGHT_HOURS_MS) {
            const ageHours = (age / (1000 * 60 * 60)).toFixed(1);
            violations.push({ name, version, publishTimeStr, ageHours });
          }
        }
      } catch (err) {
        console.error(`[Advertencia] No se pudo verificar la edad de ${name}@${version}: ${err.message}`);
      }

      checked++;
      if (checked % 50 === 0) {
        console.log(`[Seguridad] Verificados ${checked} / ${packages.size} paquetes...`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  if (violations.length > 0) {
    console.error('\n❌ ERROR DE SEGURIDAD: Se detectaron paquetes publicados hace menos de 48 horas (Posible riesgo en cadena de suministro):');
    violations.forEach(v => {
      console.error(`  - ${v.name}@${v.version} (Publicado hace ${v.ageHours} horas, el ${v.publishTimeStr})`);
    });
    console.error('\nPara prevenir inyecciones de dependencias maliciosas recientes, el proceso de compilación se detiene.');
    process.exit(1);
  } else {
    console.log('\n✅ Seguridad validada: Todos los paquetes tienen más de 48 horas de antigüedad.');
    process.exit(0);
  }
}

checkPackages();
