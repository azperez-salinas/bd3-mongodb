const express = require("express");
const router = express.Router();
const Movie = require("../models/Movie");
const Review = require("../models/Review");

router.get("/recommended", async (req, res) => {
  try {
    const topRated = await Movie.find()
      .sort({ avgRating: -1, reviewCount: -1 })
      .limit(12);

    const lowRated = await Movie.find()
      .sort({ avgRating: 1, reviewCount: -1 })
      .limit(6);

    res.json({
      topRated,
      lowRated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/top10", async (req, res) => {
  try {
    const moviesTop10 = await Movie.find()
      .sort({ avgRating: -1, reviewCount: -1 })
      .limit(10)
      .select(
        "title year category actors directors posterUrl avgRating reviewCount",
      );

    res.json(moviesTop10);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/ranking", async (req, res) => {
  try {
    //si se pasa un parámetro de categoría, se filtra por esta, si no, se muestran todas las películas
    const { category } = req.query;

    const filter = category ? { category: { $in: [category] } } : {};

    const moviesRanking = await Movie.find(filter)
      .sort({ avgRating: -1, reviewCount: -1 })
      .limit(50);

    res.json(moviesRanking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: "Película no encontrada" });
    }

    //createdAt no es un campo en la coleccion de peliculas, pero como existe el timestamp de creacion de cada review, podemos ordenar las reviews por fecha de creacion
    const reviews = await Review.find({ movieId: req.params.id }).sort({
      createdAt: -1,
    });

    //movie.toObject() extrae solo los datos reales, como un objeto JS común y corriente, sin los métodos de mongoose, y luego le agregamos las reviews como un campo más
    res.json({ ...movie.toObject(), reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ year: -1 });

    res.json(movies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
