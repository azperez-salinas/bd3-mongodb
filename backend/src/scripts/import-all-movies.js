const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const connectDB = require("../config/db");
const Movie = require("../models/Movie");
const Review = require("../models/Review");

connectDB();

const rawCsvPath = path.resolve(__dirname, "../../../mongodb.csv");
const cleanedCsvPath = path.resolve(__dirname, "../../../mongodb.cleaned.csv");
const csvPath = fs.existsSync(cleanedCsvPath) ? cleanedCsvPath : rawCsvPath;

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeJsonString = (value) => {
  if (!value) return "";

  return String(value)
    .trim()
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/gi, '"')
    .replace(/\\"/g, '"')
    .replace(/\u2019/g, "'")
    .replace(/\u201c/gi, '"')
    .replace(/\u201d/gi, '"');
};

const parseArrayField = (value) => {
  const normalized = normalizeJsonString(value);
  if (!normalized || normalized === "[]" || normalized === "null") return [];

  try {
    const arr = JSON.parse(normalized);
    if (!Array.isArray(arr)) return [];
    return arr.map((item) => String(item).trim()).filter(Boolean);
  } catch {
    return [];
  }
};

const parseReviewsField = (value) => {
  const normalized = normalizeJsonString(value);
  if (!normalized || normalized === "[]" || normalized === "null") return [];

  try {
    const arr = JSON.parse(normalized);
    return Array.isArray(arr) ? arr : [];
  } catch {
    const reviewPattern =
      /\{\s*"text"\s*:\s*"([\s\S]*?)"\s*,\s*"rating"\s*:\s*([0-9.]+)\s*,\s*"timestamp"\s*:\s*([0-9]+)\s*\}/g;

    return [...normalized.matchAll(reviewPattern)].map((match) => ({
      text: match[1],
      rating: Number(match[2]),
      timestamp: Number(match[3]),
    }));
  }
};

const importAllMovies = async () => {
  const fileContent = fs.readFileSync(csvPath, "utf8");

  const rows = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
  });

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const title = String(row.imdb_primary_title || row.title || "").trim();

    if (!title) {
      skipped += 1;
      continue;
    }

    try {
      const movieData = {
        title,
        year: toNumber(row.year, 0),
        category: parseArrayField(row.categories),
        description: "",
        posterUrl: "",
        actors: parseArrayField(row.actors),
        directors: parseArrayField(row.directors),
        writers: parseArrayField(row.writers),
        crew: parseArrayField(row.crew),
        avgRating: toNumber(row.avg_rating, 0),
        reviewCount: toNumber(
          row.json_review_count ?? row.movielens_review_count,
          0,
        ),
      };

      const movie = await Movie.findOneAndUpdate(
        { title: movieData.title, year: movieData.year },
        movieData,
        { upsert: true, new: true },
      );

      const rawReviews = parseReviewsField(row.reviews);

      for (const review of rawReviews) {
        if (!review || !review.text) continue;

        const text = String(review.text).trim().slice(0, 10000);
        const rating = toNumber(review.rating, 0);

        if (!text || rating < 1 || rating > 5) continue;

        await Review.create({
          movieId: movie._id,
          userName: "Usuario importado",
          rating,
          reviewText: text,
        });
      }

      await Movie.findByIdAndUpdate(movie._id, {
        avgRating: movieData.avgRating,
        reviewCount: movieData.reviewCount,
      });

      imported += 1;
      console.log(`Importada: ${movie.title}`);
    } catch (error) {
      skipped += 1;
      console.error(`Fila omitida: ${title}`);
      console.error(error.message);
    }
  }

  console.log(
    `Importación terminada. Importadas: ${imported}. Omitidas: ${skipped}`,
  );
  process.exit(0);
};

importAllMovies().catch((error) => {
  console.error("Error general:", error.message);
  process.exit(1);
});
