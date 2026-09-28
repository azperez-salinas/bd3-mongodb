// Completa el campo posterUrl de las películas del Top 10 consultando la API
// gratuita de OMDb (http://www.omdbapi.com) a partir del imdbId guardado en
// cada película.
//
// Necesitás una API key gratuita de OMDb: https://www.omdbapi.com/apikey.aspx
// (el plan gratuito son 1000 requests/día, más que de sobra para 10 pelis).
//
// Uso:
//   OMDB_API_KEY=tu_api_key node src/scripts/fetch-posters.js
//
// También podés definir OMDB_API_KEY en un .env / en el environment del
// servicio "seed" del docker-compose.yml si querés que corra automáticamente.

const connectDB = require("../config/db");
const Movie = require("../models/Movie");

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const TOP_N = Number(process.env.POSTERS_TOP_N || 10);

const fetchPoster = async (imdbId) => {
  const url = `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.Response === "False") {
    throw new Error(data.Error || "OMDb no encontró la película");
  }

  if (!data.Poster || data.Poster === "N/A") {
    return "";
  }

  return data.Poster;
};

const run = async () => {
  if (!OMDB_API_KEY) {
    console.error(
      "Falta OMDB_API_KEY. Conseguí una gratis en https://www.omdbapi.com/apikey.aspx " +
        "y corré: OMDB_API_KEY=tu_api_key node src/scripts/fetch-posters.js",
    );
    process.exit(1);
  }

  await connectDB();

  const movies = await Movie.find()
    .sort({ avgRating: -1, reviewCount: -1 })
    .limit(TOP_N);

  console.log(`Buscando poster para ${movies.length} películas del Top ${TOP_N}...`);

  let updated = 0;
  let skipped = 0;

  for (const movie of movies) {
    if (!movie.imdbId) {
      console.log(`Sin imdbId, se omite: ${movie.title}`);
      skipped += 1;
      continue;
    }

    if (movie.posterUrl) {
      console.log(`Ya tiene poster, se omite: ${movie.title}`);
      continue;
    }

    try {
      const posterUrl = await fetchPoster(movie.imdbId);

      if (!posterUrl) {
        console.log(`OMDb no tiene poster para: ${movie.title}`);
        skipped += 1;
        continue;
      }

      await Movie.findByIdAndUpdate(movie._id, { posterUrl });
      console.log(`Poster asignado: ${movie.title}`);
      updated += 1;
    } catch (error) {
      console.error(`Error con ${movie.title}: ${error.message}`);
      skipped += 1;
    }
  }

  console.log(`Listo. Actualizadas: ${updated}. Omitidas: ${skipped}`);
  process.exit(0);
};

run().catch((error) => {
  console.error("Error general:", error.message);
  process.exit(1);
});