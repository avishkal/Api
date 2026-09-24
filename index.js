const express = require('express');
const axios = require('axios');

const app = express();

// CORS හැඩගැස්වීම
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// මුල් පිටුව
app.get('/', (req, res) => {
  res.send('<h2>Licensed Movie API is running successfully!</h2>');
});

// 1. Search Endpoint: GET /search?q=Avatar
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query) {
      return res.json({ results: [] });
    }

    const searchUrl = `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}&limit=10`;
    const response = await axios.get(searchUrl);
    const movies = response.data?.data?.movies || [];

    const results = movies.map(movie => ({
      id: String(movie.id),
      title: movie.title,
      poster: movie.large_cover_image || movie.medium_cover_image || '',
      year: movie.year ? String(movie.year) : ''
    }));

    res.json({ results });
  } catch (error) {
    console.error("Search Error:", error.message);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

// 2. Movie Details Endpoint: GET /movies/:id
app.get('/movies/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    const detailUrl = `https://yts.mx/api/v2/movie_details.json?movie_id=${movieId}&with_images=true&with_cast=true`;
    const response = await axios.get(detailUrl);
    const movie = response.data?.data?.movie;

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // ප්ලගින එක බලාපොරොත්තු වන qualities ආකෘතිය
    const qualities = (movie.torrents || []).map(t => ({
      label: `${t.quality} (${t.type})`,
      url: t.url,
      mimeType: "video/mp4",
      fileName: `${movie.title} (${movie.year || ''}) - ${t.quality}.mp4`
    }));

    res.json({
      id: String(movie.id),
      title: movie.title,
      poster: movie.large_cover_image || movie.medium_cover_image || '',
      year: movie.year ? String(movie.year) : '',
      genre: Array.isArray(movie.genres) ? movie.genres.join(", ") : '',
      rating: movie.rating ? String(movie.rating) : '',
      synopsis: movie.description_full || movie.summary || '',
      qualities: qualities
    });
  } catch (error) {
    console.error("Details Error:", error.message);
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

module.exports = app;
