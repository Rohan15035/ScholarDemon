const express = require("express");
const db = require("../db/config");
const validators = require("../middleware/validators");

const router = express.Router();

// Get all authors with pagination
router.get("/", validators.pagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = "citations" } = req.query;
    const offset = (page - 1) * limit;

    let orderBy = "a.citation_count DESC";
    if (sort === "h-index") orderBy = "a.h_index DESC";
    if (sort === "name") orderBy = "a.name ASC";
    if (sort === "papers") orderBy = "paper_count DESC";

    const result = await db.query(
      `SELECT a.author_id, a.name, a.affiliation, a.email, a.orcid_id,
              a.h_index, a.citation_count,
              i.name as institution_name, i.country as institution_country,
              json_agg(DISTINCT ra.area_name) FILTER (WHERE ra.area_name IS NOT NULL) as research_areas,
              COUNT(DISTINCT pa.paper_id) as paper_count
       FROM authors a
       LEFT JOIN institutions i ON a.institution_id = i.institution_id
       LEFT JOIN author_research_areas ara ON a.author_id = ara.author_id
       LEFT JOIN research_areas ra ON ara.area_id = ra.area_id
       LEFT JOIN paper_authors pa ON a.author_id = pa.author_id
       GROUP BY a.author_id, i.name, i.country
       ORDER BY ${orderBy}
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await db.query("SELECT COUNT(*) FROM authors");
    const total = parseInt(countResult.rows[0].count);

    res.json({
      authors: result.rows,
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

// Search authors
router.get("/search", async (req, res) => {
  try {
    const { q, institution, area, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT DISTINCT a.author_id, a.name, a.affiliation, a.h_index, a.citation_count,
             i.name as institution_name,
             json_agg(DISTINCT ra.area_name) FILTER (WHERE ra.area_name IS NOT NULL) as research_areas,
             COUNT(DISTINCT pa.paper_id) as paper_count
      FROM authors a
      LEFT JOIN institutions i ON a.institution_id = i.institution_id
      LEFT JOIN author_research_areas ara ON a.author_id = ara.author_id
      LEFT JOIN research_areas ra ON ara.area_id = ra.area_id
      LEFT JOIN paper_authors pa ON a.author_id = pa.author_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (q) {
      query += ` AND a.name ILIKE $${paramCount}`;
      params.push(`%${q}%`);
      paramCount++;
    }

    if (institution) {
      query += ` AND i.name ILIKE $${paramCount}`;
      params.push(`%${institution}%`);
      paramCount++;
    }

    if (area) {
      query += ` AND ra.area_name ILIKE $${paramCount}`;
      params.push(`%${area}%`);
      paramCount++;
    }

    query += ` GROUP BY a.author_id, i.name
               ORDER BY a.citation_count DESC
               LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get author by ID
router.get("/:id", validators.idParam, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT a.*, i.name as institution_name, i.country as institution_country,
              i.website as institution_website,
              json_agg(DISTINCT ra.area_name) FILTER (WHERE ra.area_name IS NOT NULL) as research_areas
       FROM authors a
       LEFT JOIN institutions i ON a.institution_id = i.institution_id
       LEFT JOIN author_research_areas ara ON a.author_id = ara.author_id
       LEFT JOIN research_areas ra ON ara.area_id = ra.area_id
       WHERE a.author_id = $1
       GROUP BY a.author_id, i.name, i.country, i.website`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Author not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get author's papers
router.get("/:id/papers", validators.idParam, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT p.paper_id, p.title, p.year, p.citation_count, p.doi,
              v.name as venue_name, v.type as venue_type,
              pa.author_order,
              json_agg(DISTINCT jsonb_build_object(
                'author_id', a2.author_id,
                'name', a2.name,
                'order', pa2.author_order
              ) ORDER BY pa2.author_order) as co_authors
       FROM paper_authors pa
       JOIN papers p ON pa.paper_id = p.paper_id
       LEFT JOIN venues v ON p.venue_id = v.venue_id
       LEFT JOIN paper_authors pa2 ON p.paper_id = pa2.paper_id
       LEFT JOIN authors a2 ON pa2.author_id = a2.author_id
       WHERE pa.author_id = $1
       GROUP BY p.paper_id, v.name, v.type, pa.author_order
       ORDER BY p.year DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get author's co-authors
router.get("/:id/co-authors", validators.idParam, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT a.author_id, a.name, a.affiliation, a.h_index,
              COUNT(DISTINCT pa1.paper_id) as collaboration_count
       FROM paper_authors pa1
       JOIN paper_authors pa2 ON pa1.paper_id = pa2.paper_id
       JOIN authors a ON pa2.author_id = a.author_id
       WHERE pa1.author_id = $1 AND pa2.author_id != $1
       GROUP BY a.author_id
       ORDER BY collaboration_count DESC
       LIMIT 20`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
