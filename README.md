# UMDB Movie Club

Aplicación web de películas con MongoDB, una API en Express y un frontend en React. La aplicación permite consultar recomendaciones, el Top 10, el ranking por género y las reviews de cada película.

## Requisitos

- Docker Desktop instalado y abierto.
- Docker Compose disponible mediante `docker compose`.

## Ejecutar el proyecto

Abre PowerShell en la carpeta raíz del proyecto:

```powershell
cd C:\Desarrollo\BD\bd3-mongodb
docker compose up -d --build
```

El comando inicia MongoDB, el backend y el frontend en contenedores.

## Abrir la página

Abre esta URL en el navegador:

**http://localhost:5173**

La API del backend está disponible en:

**http://localhost:4000**

Puedes comprobar su estado en:

**http://localhost:4000/api/status**

## Comprobar los servicios

```powershell
docker compose ps
```

Los servicios `mongo`, `backend` y `frontend` deben aparecer con estado `Up`.

## Ver los registros

```powershell
docker compose logs -f
```

Para consultar solo los registros del backend:

```powershell
docker compose logs -f backend
```

## Detener la aplicación

```powershell
docker compose down
```

Los datos de MongoDB se conservan en el volumen Docker `mongo_data`.

## Aplicar cambios del código

Después de modificar el frontend o el backend, reconstruye los contenedores:

```powershell
docker compose up -d --build
```

Después, recarga el navegador con `Ctrl + F5`.

## Importación de datos

El archivo de datos utilizado para la importación es `mongodb.cleaned.csv`. Los scripts de importación se encuentran en `backend/src/scripts/`.

Para importar todas las películas desde el CSV:

```powershell
cd C:\Desarrollo\BD\bd3-mongodb\backend
node src/scripts/import-all-movies.js
```

Para sincronizar los ratings agregados desde el CSV:

```powershell
node src/scripts/sync-ratings-from-csv.js
```

Para recuperar las reviews del CSV que todavía no estén en MongoDB:

```powershell
node src/scripts/sync-reviews-from-csv.js
```

Estos scripts requieren que MongoDB esté activo y utilizan la conexión local configurada para el proyecto.

## Nota sobre `npm start`

El backend se ejecuta mediante Docker Compose. Por eso no debes ejecutar `npm start` desde la raíz ni iniciar otra instancia local mientras el contenedor `backend` esté activo: el puerto `4000` ya estará ocupado.
