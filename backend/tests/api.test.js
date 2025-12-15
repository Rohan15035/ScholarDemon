const request = require("supertest");
const app = require("../server");

describe("Auth API", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: `test${Date.now()}@example.com`,
          password: "password123",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toHaveProperty("email");
    });

    it("should reject duplicate email", async () => {
      const email = `duplicate${Date.now()}@example.com`;

      await request(app).post("/api/auth/register").send({
        name: "Test User 1",
        email: email,
        password: "password123",
      });

      const res = await request(app).post("/api/auth/register").send({
        name: "Test User 2",
        email: email,
        password: "password123",
      });

      expect(res.statusCode).toBe(409);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "john@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
    });

    it("should reject invalid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "john@example.com",
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(401);
    });
  });
});

describe("Papers API", () => {
  describe("GET /api/papers", () => {
    it("should return paginated papers", async () => {
      const res = await request(app)
        .get("/api/papers")
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("papers");
      expect(res.body).toHaveProperty("pagination");
      expect(Array.isArray(res.body.papers)).toBe(true);
    });
  });

  describe("GET /api/papers/search", () => {
    it("should search papers by query", async () => {
      const res = await request(app)
        .get("/api/papers/search")
        .query({ q: "attention" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("papers");
    });
  });
});
