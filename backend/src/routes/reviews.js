const express = require("express");
const { Types } = require("mongoose");
const router = express.Router();
const Review = require("../models/Review");
const Movie = require("../models/Movie");


const recalculateMovieStats = async (movieId) => {

  const [stats] = await Review.aggregate([
    { $match: { movieId: new Types.ObjectId(movieId) } },
    {
      $group: {
        _id: "$movieId",
        reviewCount: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const reviewCount = stats?.reviewCount ?? 0;
  const avgRating = stats ? Number(stats.avgRating.toFixed(2)) : 0;

  await Movie.findByIdAndUpdate(movieId, {
    avgRating,
    reviewCount,
  });
};

router.get("/movies/:movieId/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ movieId: req.params.movieId }).sort({
      createdAt: -1,
    });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/movies/:movieId/reviews", async (req, res) => {
  try {
    const { userName, rating, reviewText } = req.body;
    const movieId = req.params.movieId;

    if (!userName || !rating || !reviewText) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    if (reviewText.length > 10000) {
      return res
        .status(400)
        .json({ message: "La reseña no debe tener más de 10000 caracteres" });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "La calificación debe estar entre 1 y 5" });
    }

    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.status(404).json({ message: "Película no encontrada." });
    }

    if (movie.reviewCount >= 5000) {
      return res.status(400).json({
        message: "La película ya alcanzó el máximo de 5000 reseñas.",
      });
    }

    const newReview = new Review({
      movieId,
      userName,
      rating,
      reviewText,
    });

    await newReview.save();
    await recalculateMovieStats(movieId);

    res.status(201).json({
      message: "Reseña creada exitosamente",
      review: newReview,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
