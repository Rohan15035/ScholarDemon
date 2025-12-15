const { body, param, query, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

const validators = {
  // User validators
  registerUser: [
    body("name")
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage("Name must be 2-255 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    validate,
  ],

  loginUser: [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
    validate,
  ],

  // Paper validators
  createPaper: [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("abstract").optional().trim(),
    body("year")
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage("Invalid year"),
    body("doi").optional().trim(),
    body("pdf_url").optional().isURL().withMessage("Invalid PDF URL"),
    body("venue_id").optional().isInt().withMessage("Invalid venue ID"),
    validate,
  ],

  updatePaper: [
    param("id").isInt().withMessage("Invalid paper ID"),
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Title cannot be empty"),
    body("year")
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
    validate,
  ],

  // Search validators
  searchPapers: [
    query("q").optional().trim(),
    query("year").optional().isInt(),
    query("author").optional().trim(),
    query("venue").optional().trim(),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    validate,
  ],

  // Comment validators
  createComment: [
    body("paper_id").isInt().withMessage("Invalid paper ID"),
    body("comment_text")
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage("Comment must be 1-5000 characters"),
    body("parent_comment_id")
      .optional()
      .isInt()
      .withMessage("Invalid parent comment ID"),
    validate,
  ],

  // Library validators
  addToLibrary: [
    body("paper_id").isInt().withMessage("Invalid paper ID"),
    body("user_notes").optional().trim().isLength({ max: 5000 }),
    body("rating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be 1-5"),
    validate,
  ],

  // Generic validators
  idParam: [param("id").isInt().withMessage("Invalid ID"), validate],

  pagination: [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    validate,
  ],
};

module.exports = validators;
