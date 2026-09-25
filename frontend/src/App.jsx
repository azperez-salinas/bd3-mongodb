import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const formatRating = (value) =>
  value === undefined || value === null || Number.isNaN(Number(value))
    ? "0.0"
    : Number(value).toFixed(1);
const getPosterStyle = (title = "Movie") => {
  const palettes = [
    ["#ff5c8a", "#ffb347"],
    ["#00b8a9", "#f8f3d4"],
    ["#845ec2", "#ffc75f"],
    ["#0081cf", "#ff8066"],
    ["#f9f871", "#ff9671"],
    ["#d65db1", "#4d8076"],
  ];
  const index =
    [...title].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    palettes.length;
  return {
    background: `linear-gradient(145deg, ${palettes[index][0]}, ${palettes[index][1]})`,
  };
};
const getInitials = (title = "Movie") =>
  title
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
const renderStars = (value) => {
  const rating = Number(value) || 0;
  return (
    <span className="stars">
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(5 - Math.round(rating))}
    </span>
  );
};

function Poster({ movie, compact = false }) {
  const className = compact ? "poster poster-small" : "poster";
  return movie.posterUrl ? (
    <img
      className={className}
      src={movie.posterUrl}
      alt={`Poster de ${movie.title}`}
    />
  ) : (
    <div
      className={`${className} poster-fallback`}
      style={getPosterStyle(movie.title)}
    >
      <span>{getInitials(movie.title)}</span>
    </div>
  );
}

function MovieCard({ movie, onClick }) {
  return (
    <button
      type="button"
      className="movie-card"
      onClick={() => onClick(movie._id)}
    >
      <div className="card-poster-wrap">
        <Poster movie={movie} />
        <span className="card-rating">{formatRating(movie.avgRating)} / 5</span>
      </div>
      <div className="card-copy">
        <h3>{movie.title}</h3>
        <span>
          {movie.year || "Sin año"} · {movie.reviewCount || 0} reviews
        </span>
      </div>
    </button>
  );
}

function RankedMovie({ movie, rank, showGenre, onClick }) {
  return (
    <button
      type="button"
      className="ranked-movie"
      onClick={() => onClick(movie._id)}
    >
      <strong className="rank-position">{rank}</strong>
      <Poster movie={movie} compact />
      <div className="ranked-copy">
        <h3>{movie.title}</h3>
        <p>{movie.description || "Una pelicula esperando ser descubierta."}</p>
        <div className="ranked-meta">
          <span>{movie.year || "-"}</span>
          {showGenre && (
            <span>{(movie.category || []).join(", ") || "Sin genero"}</span>
          )}
          <span>{movie.reviewCount || 0} reviews</span>
        </div>
      </div>
      <div className="ranked-score">
        <b>{formatRating(movie.avgRating)}</b>
        {renderStars(movie.avgRating)}
      </div>
    </button>
  );
}

function MovieModal({ movie, onClose, onReviewSaved }) {
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState("5");
  const [reviewText, setReviewText] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const submitReview = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/movies/${movie._id}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName,
            rating: Number(rating),
            reviewText,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "No se pudo guardar la review");
      setUserName("");
      setReviewText("");
      setMessage("Review guardada. Gracias por compartirla!");
      onReviewSaved(movie._id);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="movie-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${movie.title}`}
      >
        <button
          type="button"
          className="close-button"
          onClick={onClose}
          aria-label="Cerrar"
        >
          x
        </button>
        <div className="modal-top">
          <Poster movie={movie} />
          <div>
            <span className="kicker">Ficha de pelicula</span>
            <h2>{movie.title}</h2>
            <p className="modal-description">
              {movie.description || "No hay descripcion disponible."}
            </p>
            <div className="modal-facts">
              <span>{movie.year || "-"}</span>
              <span>{(movie.category || []).join(" / ") || "Sin genero"}</span>
              <span>{formatRating(movie.avgRating)} / 5</span>
            </div>
          </div>
        </div>
        <div className="credits">
          <b>Directores:</b>{" "}
          {(movie.directors || []).join(", ") || "No registrados"}{" "}
          <b>Actores:</b>{" "}
          {(movie.actors || []).slice(0, 5).join(", ") || "No registrados"}
        </div>
        <div className="modal-columns">
          <div>
            <h3>Reviews de la comunidad</h3>
            {movie.reviews?.length ? (
              movie.reviews.map((review) => (
                <article className="review-item" key={review._id}>
                  <div>
                    <b>
                      {review.userName === "csv-import"
                        ? "Usuario importado"
                        : review.userName}
                    </b>
                    <span>{review.rating} / 5</span>
                  </div>
                  <p>{review.reviewText}</p>
                </article>
              ))
            ) : (
              <p className="muted">Todavia no hay reviews.</p>
            )}
          </div>
          <form className="review-form" onSubmit={submitReview}>
            <h3>Escribe tu review</h3>
            <label>
              Tu nombre
              <input
                required
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
              />
            </label>
            <label>
              Calificacion
              <select
                value={rating}
                onChange={(event) => setRating(event.target.value)}
              >
                {[5, 4, 3, 2, 1].map((number) => (
                  <option key={number} value={number}>
                    {number} estrellas
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tu opinion
              <textarea
                required
                rows="5"
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
              />
            </label>
            <button className="retro-button" disabled={saving}>
              {saving ? "Guardando..." : "Publicar review"}
            </button>
            {message && <p className="form-message">{message}</p>}
          </form>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [recommended, setRecommended] = useState([]);
  const [worst, setWorst] = useState([]);
  const [top10, setTop10] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [category, setCategory] = useState("");
  const [order, setOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const categories = useMemo(
    () => [...new Set(ranking.flatMap((movie) => movie.category || []))].sort(),
    [ranking],
  );
  const loadDetail = async (movieId) => {
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}`);
    if (response.ok) setSelectedMovie(await response.json());
  };
  const loadRanking = async () => {
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    const response = await fetch(`${API_BASE_URL}/movies/ranking${query}`);
    if (response.ok) setRanking(await response.json());
  };
  useEffect(() => {
    const load = async () => {
      try {
        const [recommendedResponse, topResponse, rankingResponse] =
          await Promise.all([
            fetch(`${API_BASE_URL}/movies/recommended`),
            fetch(`${API_BASE_URL}/movies/top10`),
            fetch(`${API_BASE_URL}/movies/ranking`),
          ]);
        const recommendedData = await recommendedResponse.json();
        setRecommended(recommendedData.topRated || []);
        setWorst(recommendedData.lowRated || []);
        setTop10(await topResponse.json());
        setRanking(await rankingResponse.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  useEffect(() => {
    if (!loading) loadRanking();
  }, [category]);
  const sortedRanking = [...ranking].sort((a, b) => {
    const ratingDifference =
      Number(b.avgRating || 0) - Number(a.avgRating || 0);
    if (ratingDifference !== 0)
      return order === "desc" ? ratingDifference : -ratingDifference;
    return Number(b.reviewCount || 0) - Number(a.reviewCount || 0);
  });
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="logo" href="#inicio" onClick={() => setView("home")}>
          <span>UM</span> MOVIE CLUB
        </a>
        <nav>
          <button
            className={view === "home" ? "active" : ""}
            onClick={() => setView("home")}
          >
            Inicio
          </button>
          <button
            className={view === "top" ? "active" : ""}
            onClick={() => setView("top")}
          >
            Top 10
          </button>
          <button
            className={view === "ranking" ? "active" : ""}
            onClick={() => setView("ranking")}
          >
            Ranking
          </button>
        </nav>
        <span className="header-badge">CINE! CINE! CINE!</span>
      </header>
      <main className="main-content">
        {view === "home" && (
          <>
            <section className="intro">
              <span className="kicker">Tu cartelera personal</span>
              <h1>
                <span className="title-line">Peliculas para ver</span>
                <br />
                <em>sin aburrirse.</em>
              </h1>
              <p>
                Recomendaciones, hallazgos raros y opiniones de la comunidad.
              </p>
            </section>
            <section className="movie-section">
              <div className="section-title">
                <h2>Peliculas recomendadas</h2>
                <span>12 favoritas</span>
              </div>
              <div className="movie-grid">
                {loading ? (
                  <p className="muted">Cargando peliculas...</p>
                ) : (
                  recommended.map((movie) => (
                    <MovieCard
                      key={movie._id}
                      movie={movie}
                      onClick={loadDetail}
                    />
                  ))
                )}
              </div>
            </section>
            <section className="movie-section worst-section">
              <div className="section-title">
                <h2>Explora las peores peliculas</h2>
                <span>6 joyas cuestionables</span>
              </div>
              <div className="movie-grid">
                {worst.map((movie) => (
                  <MovieCard
                    key={movie._id}
                    movie={movie}
                    onClick={loadDetail}
                  />
                ))}
              </div>
            </section>
          </>
        )}
        {view === "top" && (
          <section className="listing-page">
            <div className="section-title">
              <div>
                <span className="kicker">Las mas votadas</span>
                <h2>Top 10 peliculas</h2>
              </div>
              <span>1 al 10</span>
            </div>
            <div className="rank-list">
              {top10.map((movie, index) => (
                <RankedMovie
                  key={movie._id}
                  movie={movie}
                  rank={index + 1}
                  onClick={loadDetail}
                />
              ))}
            </div>
          </section>
        )}
        {view === "ranking" && (
          <section className="listing-page">
            <div className="section-title">
              <div>
                <span className="kicker">La tabla completa</span>
                <h2>Ranking de peliculas</h2>
              </div>
              <span>Hasta 50 puestos</span>
            </div>
            <div className="filters">
              <label>
                Genero
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="">Todos los generos</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Orden
                <select
                  value={order}
                  onChange={(event) => setOrder(event.target.value)}
                >
                  <option value="desc">Mejor a peor · 1 al 50</option>
                  <option value="asc">Peor a mejor · 50 al 1</option>
                </select>
              </label>
            </div>
            <div className="rank-list">
              {sortedRanking.map((movie, index) => (
                <RankedMovie
                  key={movie._id}
                  movie={movie}
                  rank={
                    order === "desc" ? index + 1 : sortedRanking.length - index
                  }
                  showGenre
                  onClick={loadDetail}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onReviewSaved={loadDetail}
        />
      )}
    </div>
  );
}
