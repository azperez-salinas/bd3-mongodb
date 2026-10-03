const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      required: true,
      trim: true,
      maxlength: [10000, "La reseña no puede superar los 10000 caracteres"],
    },
  },
  {
    timestamps: true,
  },
);

movieSchema.index({ movieId: 1 });
module.exports = mongoose.model("Review", movieSchema);
