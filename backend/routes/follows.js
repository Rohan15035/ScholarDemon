const express = require("express");
const db = require("../db/config");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Follow an author
router.post("/authors/:authorId", auth, async (req, res) => {
  try {
    const { authorId } = req.params;

    const result = await db.query(
      `INSERT INTO user_follows_authors (user_id, author_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, author_id) DO NOTHING
       RETURNING *`,
      [req.user.user_id, authorId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "Already following this author" });
    }

    res.status(201).json({ message: "Successfully followed author" });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(404).json({ error: "Author not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Unfollow an author
router.delete("/authors/:authorId", auth, async (req, res) => {
  try {
    const { authorId } = req.params;

    const result = await db.query(
      "DELETE FROM user_follows_authors WHERE user_id = $1 AND author_id = $2 RETURNING *",
      [req.user.user_id, authorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not following this author" });
    }

    res.json({ message: "Successfully unfollowed author" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get followed authors
router.get("/authors", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.author_id, a.name, a.affiliation, a.h_index, a.citation_count,
              ufa.followed_at,
              COUNT(DISTINCT pa.paper_id) as paper_count
       FROM user_follows_authors ufa
       JOIN authors a ON ufa.author_id = a.author_id
       LEFT JOIN paper_authors pa ON a.author_id = pa.author_id
       WHERE ufa.user_id = $1
       GROUP BY a.author_id, ufa.followed_at
       ORDER BY ufa.followed_at DESC`,
      [req.user.user_id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if following an author
router.get("/authors/:authorId/check", auth, async (req, res) => {
  try {
    const { authorId } = req.params;

    const result = await db.query(
      "SELECT * FROM user_follows_authors WHERE user_id = $1 AND author_id = $2",
      [req.user.user_id, authorId]
    );

    res.json({ is_following: result.rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Follow a venue
router.post("/venues/:venueId", auth, async (req, res) => {
  try {
    const { venueId } = req.params;

    const result = await db.query(
      `INSERT INTO user_follows_venues (user_id, venue_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, venue_id) DO NOTHING
       RETURNING *`,
      [req.user.user_id, venueId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "Already following this venue" });
    }

    res.status(201).json({ message: "Successfully followed venue" });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(404).json({ error: "Venue not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Unfollow a venue
router.delete("/venues/:venueId", auth, async (req, res) => {
  try {
    const { venueId } = req.params;

    const result = await db.query(
      "DELETE FROM user_follows_venues WHERE user_id = $1 AND venue_id = $2 RETURNING *",
      [req.user.user_id, venueId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not following this venue" });
    }

    res.json({ message: "Successfully unfollowed venue" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get followed venues
router.get("/venues", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT v.venue_id, v.name, v.short_name, v.type, v.impact_factor,
              ufv.followed_at,
              COUNT(DISTINCT p.paper_id) as paper_count
       FROM user_follows_venues ufv
       JOIN venues v ON ufv.venue_id = v.venue_id
       LEFT JOIN papers p ON v.venue_id = p.venue_id
       WHERE ufv.user_id = $1
       GROUP BY v.venue_id, ufv.followed_at
       ORDER BY ufv.followed_at DESC`,
      [req.user.user_id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if following a venue
router.get("/venues/:venueId/check", auth, async (req, res) => {
  try {
    const { venueId } = req.params;

    const result = await db.query(
      "SELECT * FROM user_follows_venues WHERE user_id = $1 AND venue_id = $2",
      [req.user.user_id, venueId]
    );

    res.json({ is_following: result.rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get personalized feed based on follows
router.get("/feed", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT DISTINCT p.paper_id, p.title, p.abstract, p.year, p.citation_count,
              p.created_at,
              v.name as venue_name,
              json_agg(DISTINCT a.name ORDER BY pa.author_order) as authors,
              (CASE 
                WHEN ufa.user_id IS NOT NULL THEN 'author'
                WHEN ufv.user_id IS NOT NULL THEN 'venue'
              END) as follow_type
       FROM papers p
       LEFT JOIN venues v ON p.venue_id = v.venue_id
       LEFT JOIN paper_authors pa ON p.paper_id = pa.paper_id
       LEFT JOIN authors a ON pa.author_id = a.author_id
       LEFT JOIN user_follows_authors ufa ON pa.author_id = ufa.author_id AND ufa.user_id = $1
       LEFT JOIN user_follows_venues ufv ON p.venue_id = ufv.venue_id AND ufv.user_id = $1
       WHERE (ufa.user_id IS NOT NULL OR ufv.user_id IS NOT NULL)
       GROUP BY p.paper_id, v.name, ufa.user_id, ufv.user_id
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.user_id, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
