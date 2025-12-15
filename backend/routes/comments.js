const express = require("express");
const db = require("../db/config");
const { auth } = require("../middleware/auth");
const validators = require("../middleware/validators");

const router = express.Router();

// Get comments for a paper (with threading)
router.get("/paper/:paperId", async (req, res) => {
  try {
    const { paperId } = req.params;

    const result = await db.query(
      `WITH RECURSIVE comment_tree AS (
         SELECT c.comment_id, c.user_id, c.paper_id, c.comment_text, 
                c.created_at, c.parent_comment_id,
                u.name as user_name,
                0 as depth,
                ARRAY[c.comment_id] as path
         FROM comments c
         JOIN users u ON c.user_id = u.user_id
         WHERE c.paper_id = $1 AND c.parent_comment_id IS NULL
         
         UNION ALL
         
         SELECT c.comment_id, c.user_id, c.paper_id, c.comment_text,
                c.created_at, c.parent_comment_id,
                u.name as user_name,
                ct.depth + 1,
                ct.path || c.comment_id
         FROM comments c
         JOIN users u ON c.user_id = u.user_id
         JOIN comment_tree ct ON c.parent_comment_id = ct.comment_id
         WHERE ct.depth < 10
       )
       SELECT * FROM comment_tree
       ORDER BY path`,
      [paperId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a comment
router.post("/", auth, validators.createComment, async (req, res) => {
  try {
    const { paper_id, comment_text, parent_comment_id } = req.body;

    // Check if paper exists
    const paperCheck = await db.query(
      "SELECT paper_id FROM papers WHERE paper_id = $1",
      [paper_id]
    );

    if (paperCheck.rows.length === 0) {
      return res.status(404).json({ error: "Paper not found" });
    }

    // If parent comment specified, verify it exists and belongs to same paper
    if (parent_comment_id) {
      const parentCheck = await db.query(
        "SELECT paper_id FROM comments WHERE comment_id = $1",
        [parent_comment_id]
      );

      if (parentCheck.rows.length === 0) {
        return res.status(404).json({ error: "Parent comment not found" });
      }

      if (parentCheck.rows[0].paper_id !== paper_id) {
        return res
          .status(400)
          .json({ error: "Parent comment belongs to different paper" });
      }
    }

    const result = await db.query(
      `INSERT INTO comments (user_id, paper_id, comment_text, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING comment_id, user_id, paper_id, comment_text, created_at, parent_comment_id`,
      [req.user.user_id, paper_id, comment_text, parent_comment_id]
    );

    const comment = result.rows[0];
    comment.user_name = req.user.name;

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a comment
router.patch("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment_text } = req.body;

    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const result = await db.query(
      `UPDATE comments 
       SET comment_text = $1
       WHERE comment_id = $2 AND user_id = $3
       RETURNING *`,
      [comment_text, id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Comment not found or unauthorized" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a comment
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user owns the comment or is admin
    const result = await db.query(
      `DELETE FROM comments 
       WHERE comment_id = $1 AND (user_id = $2 OR $3 = 'admin')
       RETURNING *`,
      [id, req.user.user_id, req.user.role]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Comment not found or unauthorized" });
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's comments
router.get("/user/me", auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, p.title as paper_title
       FROM comments c
       JOIN papers p ON c.paper_id = p.paper_id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC
       LIMIT 50`,
      [req.user.user_id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
