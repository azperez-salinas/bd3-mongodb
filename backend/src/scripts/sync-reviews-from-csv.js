const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const connectDB = require("../config/db");
const Movie = require("../models/Movie");
const Review = require("../models/Review");

const csvPath = path.resolve(__dirname, "../../../mongodb.cleaned.csv");

const normalizeJsonString = (value) =>
  String(value || "")
    .trim()
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/gi, '"')
    .replace(/\\"/g, '"');

const parseReviewsField = (value) => {
  const normalized = normalizeJsonString(value);
  if (!normalized || normalized === "[]" || normalized === "null") return [];

  try {
    const reviews = JSON.parse(normalized);
    return Array.isArray(reviews) ? reviews : [];
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

const syncReviews = async () => {
  await connectDB();
  const rows = parse(fs.readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
  });

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const title = String(row.imdb_primary_title || row.title || "").trim();
    const year = Number(row.year || 0);
    const movie = await Movie.findOne({ title, year }).select("_id");
    if (!movie) continue;

    const existingReviews = await Review.find({ movieId: movie._id })
      .select("reviewText")
      .lean();
    const existingTexts = new Set(
      existingReviews.map((review) => review.reviewText),
    );

    for (const review of parseReviewsField(row.reviews)) {
      const text = String(review.text || "")
        .trim()
        .slice(0, 10000);
      const rating = Number(review.rating || 0);
      if (!text || rating < 1 || rating > 5) {
        skipped += 1;
        continue;
      }

      if (existingTexts.has(text)) continue;

      await Review.create({
        movieId: movie._id,
        userName: "Usuario importado",
        rating,
        reviewText: text,
      });
      existingTexts.add(text);
      inserted += 1;
    }
  }

  console.log(
    `Reviews sincronizadas. Insertadas: ${inserted}. Omitidas: ${skipped}`,
  );
  process.exit(0);
};

syncReviews().catch((error) => {
  console.error("Error sincronizando reviews:", error.message);
  process.exit(1);
});
