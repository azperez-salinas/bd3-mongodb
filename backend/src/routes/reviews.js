const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Movie = require("../models/Movie");

const recalculateMovieStats = async (movieId) => {
  //busca todas las reviews de la película
  const reviews = await Review.find({ movieId });
  //calcula la cantidad de reiews
  const reviewCount = reviews.length;
  //suma todas las calificaciones, reduce recorre el array y acumula el valor de la calificacion en la variable sum, y al final devuelve el total
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  //calcula el promedio de calificaciones , si no hay reviews, el promedio es 0, y lo redondea a 2 decimales
  const avgRating =
    reviewCount > 0 ? Number((total / reviewCount).toFixed(2)) : 0;

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
