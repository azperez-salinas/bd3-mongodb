const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const connectDB = require("../config/db");
const Movie = require("../models/Movie");

const csvPath = path.resolve(__dirname, "../../../mongodb.cleaned.csv");

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const syncRatings = async () => {
  await connectDB();

  const rows = parse(fs.readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
  });

  let updated = 0;
  let missing = 0;

  for (const row of rows) {
    const title = String(row.imdb_primary_title || row.title || "").trim();
    const year = toNumber(row.year, 0);

    if (!title) continue;

    const movie = await Movie.findOneAndUpdate(
      { title, year },
      {
        avgRating: toNumber(row.avg_rating, 0),
        reviewCount: toNumber(
          row.json_review_count ?? row.movielens_review_count,
          0,
        ),
      },
      { new: true },
    );

    if (movie) updated += 1;
    else missing += 1;
  }

  console.log(
    `Ratings sincronizados. Actualizadas: ${updated}. No encontradas: ${missing}`,
  );
  process.exit(0);
};

syncRatings().catch((error) => {
  console.error("Error sincronizando ratings:", error.message);
  process.exit(1);
});
