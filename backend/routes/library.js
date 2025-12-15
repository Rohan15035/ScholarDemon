const express = require("express");
const db = require("../db/config");
const { auth } = require("../middleware/auth");
const validators = require("../middleware/validators");

const router = express.Router();

// Get user's library
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = "recent" } = req.query;
    const offset = (page - 1) * limit;

    let orderBy = "ul.added_at DESC";
    if (sort === "rating") orderBy = "ul.rating DESC NULLS LAST";
    if (sort === "title") orderBy = "p.title ASC";
    if (sort === "year") orderBy = "p.year DESC";

    const result = await db.query(
      `SELECT p.paper_id, p.title, p.abstract, p.year, p.citation_count,
              ul.added_at, ul.user_notes, ul.rating,
              v.name as venue_name,
              json_agg(DISTINCT a.name ORDER BY pa.author_order) as authors
       FROM user_library ul
       JOIN papers p ON ul.paper_id = p.paper_id
       LEFT JOIN venues v ON p.venue_id = v.venue_id
       LEFT JOIN paper_authors pa ON p.paper_id = pa.paper_id
       LEFT JOIN authors a ON pa.author_id = a.author_id
       WHERE ul.user_id = $1
       GROUP BY p.paper_id, ul.added_at, ul.user_notes, ul.rating, v.name
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [req.user.user_id, limit, offset]
    );

    const countResult = await db.query(
      "SELECT COUNT(*) FROM user_library WHERE user_id = $1",
      [req.user.user_id]
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      papers: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add paper to library
router.post("/", auth, validators.addToLibrary, async (req, res) => {
  try {
    const { paper_id, user_notes, rating } = req.body;

    const result = await db.query(
      `INSERT INTO user_library (user_id, paper_id, user_notes, rating)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, paper_id) 
       DO UPDATE SET user_notes = $3, rating = $4
       RETURNING *`,
      [req.user.user_id, paper_id, user_notes, rating]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23503") {
      return res.status(404).json({ error: "Paper not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update library entry
router.patch("/:paperId", auth, async (req, res) => {
  try {
    const { paperId } = req.params;
    const { user_notes, rating } = req.body;

    const updates = [];
    const values = [req.user.user_id, paperId];
    let paramCount = 3;

    if (user_notes !== undefined) {
      updates.push(`user_notes = $${paramCount++}`);
      values.push(user_notes);
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: "Rating must be between 1 and 5" });
      }
      updates.push(`rating = $${paramCount++}`);
      values.push(rating);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    const result = await db.query(
      `UPDATE user_library 
       SET ${updates.join(", ")}
       WHERE user_id = $1 AND paper_id = $2
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paper not in library" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove paper from library
router.delete("/:paperId", auth, async (req, res) => {
  try {
    const { paperId } = req.params;

    const result = await db.query(
      "DELETE FROM user_library WHERE user_id = $1 AND paper_id = $2 RETURNING *",
      [req.user.user_id, paperId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paper not in library" });
    }

    res.json({ message: "Paper removed from library" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if paper is in library
router.get("/check/:paperId", auth, async (req, res) => {
  try {
    const { paperId } = req.params;

    const result = await db.query(
      "SELECT * FROM user_library WHERE user_id = $1 AND paper_id = $2",
      [req.user.user_id, paperId]
    );

    res.json({
      in_library: result.rows.length > 0,
      entry: result.rows[0] || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get library statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         COUNT(*) as total_papers,
         COUNT(rating) as rated_papers,
         AVG(rating) as average_rating,
         json_agg(DISTINCT ra.area_name) FILTER (WHERE ra.area_name IS NOT NULL) as research_areas
       FROM user_library ul
       JOIN papers p ON ul.paper_id = p.paper_id
       LEFT JOIN paper_research_areas pra ON p.paper_id = pra.paper_id
       LEFT JOIN research_areas ra ON pra.area_id = ra.area_id
       WHERE ul.user_id = $1`,
      [req.user.user_id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
