const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1888, //primer año de película conocida
    },
    category: {
      type: [String],
      required: true,
      default: [],
    },
    description: {
      type: String,
      default: "",
    },
    posterUrl: {
      type: String,
      default: "",
    },
    actors: {
      type: [String],
      validate: {
        validator: function (value) {
          return value.length <= 100;
        },
        message: "Una película no puede tener más de 100 actores",
      },
    },
    directors: {
      type: [String],
      default: [],
    },
    crew: {
      type: [String],
      default: [],
    },
    writers: {
      type: [String],
      default: [],
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 5000,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Movie", movieSchema);
