#!/bin/bash
echo "=== Iniciando desinstalación limpia del proyecto de Cuestionarios ==="

# 1. Detener y remover contenedores, volúmenes e imágenes locales
if [ -f "docker-compose.prod.yml" ]; then
    echo "Deteniendo y eliminando contenedores, volúmenes y red Docker..."
    docker compose -f docker-compose.prod.yml down -v --rmi local
else
    echo "No se encontró docker-compose.prod.yml en este directorio."
fi

# 2. Borrar físicamente el directorio de despliegue
echo "Eliminando archivos del proyecto..."
# Como este script se está ejecutando desde el propio directorio, podemos borrar
# todo su contenido y luego el directorio padre. O programar una eliminación limpia.
# Una buena práctica al auto-eliminarse es borrar todo excepto el script y luego borrar el script en segundo plano.
# O bien, simplemente remover el directorio /home/vps-admin/descubrimiento desde una ruta externa.
# Para evitar errores de 'archivo ocupado', removemos todo el contenido excepto este script, y luego borramos el resto.
find . -mindepth 1 -maxdepth 1 ! -name 'cleanup.sh' -exec rm -rf {} +

echo "=== Desinstalación completada con éxito ==="
echo "Nota: Recuerda eliminar la regla del puerto 4321 en el firewall de Hostinger."
