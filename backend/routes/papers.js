const express = require("express");
const db = require("../db/config");
const validators = require("../middleware/validators");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Search papers with advanced filters
router.get(
  "/search",
  validators.searchPapers,
  optionalAuth,
  async (req, res) => {
    try {
      const {
        q,
        author,
        venue,
        year,
        keyword,
        area,
        page = 1,
        limit = 20,
        sort = "relevance",
      } = req.query;

      const offset = (page - 1) * limit;
      let query = `
      SELECT DISTINCT p.paper_id, p.title, p.abstract, p.year, p.doi, 
             p.pdf_url, p.citation_count, p.created_at,
             v.name as venue_name, v.type as venue_type,
             json_agg(DISTINCT jsonb_build_object(
               'author_id', a.author_id,
               'name', a.name,
               'order', pa.author_order
             ) ORDER BY pa.author_order) as authors,
             json_agg(DISTINCT k.keyword) FILTER (WHERE k.keyword IS NOT NULL) as keywords
      FROM papers p
      LEFT JOIN venues v ON p.venue_id = v.venue_id
      LEFT JOIN paper_authors pa ON p.paper_id = pa.paper_id
      LEFT JOIN authors a ON pa.author_id = a.author_id
      LEFT JOIN paper_keywords pk ON p.paper_id = pk.paper_id
      LEFT JOIN keywords k ON pk.keyword_id = k.keyword_id
      LEFT JOIN paper_research_areas pra ON p.paper_id = pra.paper_id
      LEFT JOIN research_areas ra ON pra.area_id = ra.area_id
      WHERE 1=1
    `;

      const params = [];
      let paramCount = 1;

      if (q) {
        query += ` AND (
        to_tsvector('english', p.title) @@ plainto_tsquery('english', $${paramCount})
        OR to_tsvector('english', p.abstract) @@ plainto_tsquery('english', $${paramCount})
        OR p.title ILIKE $${paramCount + 1}
      )`;
        params.push(q, `%${q}%`);
        paramCount += 2;
      }

      if (author) {
        query += ` AND a.name ILIKE $${paramCount}`;
        params.push(`%${author}%`);
        paramCount++;
      }

      if (venue) {
        query += ` AND v.name ILIKE $${paramCount}`;
        params.push(`%${venue}%`);
        paramCount++;
      }

      if (year) {
        query += ` AND p.year = $${paramCount}`;
        params.push(year);
        paramCount++;
      }

      if (keyword) {
        query += ` AND k.keyword ILIKE $${paramCount}`;
        params.push(`%${keyword}%`);
        paramCount++;
      }

      if (area) {
        query += ` AND ra.area_name ILIKE $${paramCount}`;
        params.push(`%${area}%`);
        paramCount++;
      }

      query += " GROUP BY p.paper_id, v.name, v.type";

      // Sorting
      switch (sort) {
        case "citations":
          query += " ORDER BY p.citation_count DESC";
          break;
        case "year":
          query += " ORDER BY p.year DESC";
          break;
        case "title":
          query += " ORDER BY p.title ASC";
          break;
        default:
          query += " ORDER BY p.citation_count DESC, p.year DESC";
      }

      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Get total count
      let countQuery = "SELECT COUNT(DISTINCT p.paper_id) FROM papers p";
      if (author || venue || keyword || area) {
        countQuery += `
        LEFT JOIN paper_authors pa ON p.paper_id = pa.paper_id
        LEFT JOIN authors a ON pa.author_id = a.author_id
        LEFT JOIN venues v ON p.venue_id = v.venue_id
        LEFT JOIN paper_keywords pk ON p.paper_id = pk.paper_id
        LEFT JOIN keywords k ON pk.keyword_id = k.keyword_id
        LEFT JOIN paper_research_areas pra ON p.paper_id = pra.paper_id
        LEFT JOIN research_areas ra ON pra.area_id = ra.area_id
      `;
      }
      countQuery += " WHERE 1=1";

      const countParams = [];
      let countParamNum = 1;

      if (q) {
        countQuery += ` AND (
        to_tsvector('english', p.title) @@ plainto_tsquery('english', $${countParamNum})
        OR to_tsvector('english', p.abstract) @@ plainto_tsquery('english', $${countParamNum})
        OR p.title ILIKE $${countParamNum + 1}
      )`;
        countParams.push(q, `%${q}%`);
        countParamNum += 2;
      }

      if (author) {
        countQuery += ` AND a.name ILIKE $${countParamNum}`;
        countParams.push(`%${author}%`);
        countParamNum++;
      }

      if (venue) {
        countQuery += ` AND v.name ILIKE $${countParamNum}`;
        countParams.push(`%${venue}%`);
        countParamNum++;
      }

      if (year) {
        countQuery += ` AND p.year = $${countParamNum}`;
        countParams.push(year);
        countParamNum++;
      }

      if (keyword) {
        countQuery += ` AND k.keyword ILIKE $${countParamNum}`;
        countParams.push(`%${keyword}%`);
        countParamNum++;
      }

      if (area) {
        countQuery += ` AND ra.area_name ILIKE $${countParamNum}`;
        countParams.push(`%${area}%`);
      }

      const countResult = await db.query(countQuery, countParams);
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
  }
);

// Get all papers with pagination
router.get("/", validators.pagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = "recent" } = req.query;
    const offset = (page - 1) * limit;

    let orderBy = "p.created_at DESC";
    if (sort === "citations") orderBy = "p.citation_count DESC";
    if (sort === "year") orderBy = "p.year DESC";
    if (sort === "title") orderBy = "p.title ASC";

    const result = await db.query(
      `SELECT p.paper_id, p.title, p.abstract, p.year, p.doi, 
              p.pdf_url, p.citation_count,
              v.name as venue_name, v.type as venue_type,
              json_agg(DISTINCT jsonb_build_object(
                'author_id', a.author_id,
                'name', a.name,
                'order', pa.author_order
              ) ORDER BY pa.author_order) as authors
       FROM papers p
       LEFT JOIN venues v ON p.venue_id = v.venue_id
       LEFT JOIN paper_authors pa ON p.paper_id = pa.paper_id
       LEFT JOIN authors a ON pa.author_id = a.author_id
       GROUP BY p.paper_id, v.name, v.type
       ORDER BY ${orderBy}
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await db.query("SELECT COUNT(*) FROM papers");
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

// Get paper by ID
router.get("/:id", validators.idParam, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT p.*, v.name as venue_name, v.short_name as venue_short_name,
              v.type as venue_type, v.publisher,
              json_agg(DISTINCT jsonb_build_object(
                'author_id', a.author_id,
                'name', a.name,
                'affiliation', a.affiliation,
                'orcid_id', a.orcid_id,
                'order', pa.author_order
              ) ORDER BY pa.author_order) as authors,
              json_agg(DISTINCT k.keyword) FILTER (WHERE k.keyword IS NOT NULL) as keywords,
              json_agg(DISTINCT ra.area_name) FILTER (WHERE ra.area_name IS NOT NULL) as research_areas
       FROM papers p
       LEFT JOIN venues v ON p.venue_id = v.venue_id
       LEFT JOIN paper_authors pa ON p.paper_id = pa.paper_id
       LEFT JOIN authors a ON pa.author_id = a.author_id
       LEFT JOIN paper_keywords pk ON p.paper_id = pk.paper_id
       LEFT JOIN keywords k ON pk.keyword_id = k.keyword_id
       LEFT JOIN paper_research_areas pra ON p.paper_id = pra.paper_id
       LEFT JOIN research_areas ra ON pra.area_id = ra.area_id
       WHERE p.paper_id = $1
       GROUP BY p.paper_id, v.name, v.short_name, v.type, v.publisher`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paper not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get citations for a paper
router.get("/:id/citations", validators.idParam, async (req, res) => {
  try {
    const { id } = req.params;
    const { type = "cited" } = req.query;

    let query;
    if (type === "citing") {
      // Papers that cite this paper
      query = `
        SELECT p.paper_id, p.title, p.year, p.citation_count,
               c.citation_context,
               json_agg(DISTINCT a.name ORDER BY pa.author_order) as authors
        FROM citations c
        JOIN papers p ON c.citing_paper_id = p.paper_id
        LEFT JOIN paper_authors pa ON p.paper_id = pa.paper_id
        LEFT JOIN authors a ON pa.author_id = a.author_id
        WHERE c.cited_paper_id = $1
        GROUP BY p.paper_id, c.citation_context
        ORDER BY p.year DESC
      `;
    } else {
      // Papers cited by this paper
      query = `
        SELECT p.paper_id, p.title, p.year, p.citation_count,
               c.citation_context,
               json_agg(DISTINCT a.name ORDER BY pa.author_order) as authors
        FROM citations c
        JOIN papers p ON c.cited_paper_id = p.paper_id
        LEFT JOIN paper_authors pa ON p.paper_id = pa.paper_id
        LEFT JOIN authors a ON pa.author_id = a.author_id
        WHERE c.citing_paper_id = $1
        GROUP BY p.paper_id, c.citation_context
        ORDER BY p.year DESC
      `;
    }

    const result = await db.query(query, [id]);

    res.json({
      type,
      count: result.rows.length,
      citations: result.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comments for a paper
router.get("/:id/comments", validators.idParam, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `WITH RECURSIVE comment_tree AS (
         SELECT c.*, u.name as user_name, 0 as depth
         FROM comments c
         JOIN users u ON c.user_id = u.user_id
         WHERE c.paper_id = $1 AND c.parent_comment_id IS NULL
         
         UNION ALL
         
         SELECT c.*, u.name as user_name, ct.depth + 1
         FROM comments c
         JOIN users u ON c.user_id = u.user_id
         JOIN comment_tree ct ON c.parent_comment_id = ct.comment_id
       )
       SELECT * FROM comment_tree
       ORDER BY created_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recommended papers (similar papers based on keywords and citations)
router.get("/:id/recommendations", validators.idParam, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const result = await db.query(
      `WITH paper_keywords AS (
         SELECT keyword_id FROM paper_keywords WHERE paper_id = $1
       ),
       paper_citations AS (
         SELECT cited_paper_id FROM citations WHERE citing_paper_id = $1
         UNION
         SELECT citing_paper_id FROM citations WHERE cited_paper_id = $1
       )
       SELECT DISTINCT p.paper_id, p.title, p.year, p.citation_count,
              v.name as venue_name,
              json_agg(DISTINCT a.name) as authors,
              COUNT(DISTINCT pk.keyword_id) as common_keywords,
              (CASE WHEN pc.cited_paper_id IS NOT NULL THEN 1 ELSE 0 END) as citation_link
       FROM papers p
       LEFT JOIN venues v ON p.venue_id = v.venue_id
       LEFT JOIN paper_authors pa ON p.paper_id = pa.paper_id
       LEFT JOIN authors a ON pa.author_id = a.author_id
       LEFT JOIN paper_keywords pk ON p.paper_id = pk.paper_id
       LEFT JOIN paper_citations pc ON p.paper_id = pc.cited_paper_id
       WHERE p.paper_id != $1
         AND (pk.keyword_id IN (SELECT keyword_id FROM paper_keywords)
              OR pc.cited_paper_id IS NOT NULL)
       GROUP BY p.paper_id, v.name, pc.cited_paper_id
       ORDER BY citation_link DESC, common_keywords DESC, p.citation_count DESC
       LIMIT $2`,
      [id, limit]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
