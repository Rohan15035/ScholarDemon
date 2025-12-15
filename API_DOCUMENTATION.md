# ScholarDemon API Reference

Base URL: `http://localhost:5000/api`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

### Success Response

```json
{
  "data": { ... }
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": [ ... ] // Optional validation errors
}
```

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP address
- **Response**: 429 Too Many Requests

## Endpoints

### Authentication

#### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "name": "string (required, 2-255 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)",
  "role": "string (optional, default: 'user')"
}
```

**Response:** 201 Created

```json
{
  "user": {
    "user_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/login

Login with existing credentials.

**Request Body:**

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:** 200 OK

```json
{
  "user": {
    "user_id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "is_verified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET /auth/me

Get current user profile. **[Authenticated]**

**Response:** 200 OK

```json
{
  "user_id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "created_at": "2024-01-01T00:00:00.000Z",
  "last_login": "2024-01-15T10:30:00.000Z",
  "is_verified": true
}
```

#### PATCH /auth/me

Update current user profile. **[Authenticated]**

**Request Body:**

```json
{
  "name": "string (optional)"
}
```

#### POST /auth/change-password

Change user password. **[Authenticated]**

**Request Body:**

```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 6 chars)"
}
```

---

### Papers

#### GET /papers

Get all papers with pagination.

**Query Parameters:**

- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 100)
- `sort` (string: 'recent', 'citations', 'year', 'title')

**Response:** 200 OK

```json
{
  "papers": [
    {
      "paper_id": 1,
      "title": "Attention Is All You Need",
      "abstract": "We propose a new simple network...",
      "year": 2017,
      "doi": "10.5555/3295222.3295349",
      "pdf_url": "https://arxiv.org/pdf/1706.03762.pdf",
      "citation_count": 50000,
      "venue_name": "NeurIPS",
      "venue_type": "conference",
      "authors": [{ "author_id": 1, "name": "Author Name", "order": 1 }]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### GET /papers/search

Search papers with advanced filters.

**Query Parameters:**

- `q` (string): Search query for title/abstract
- `author` (string): Filter by author name
- `venue` (string): Filter by venue name
- `year` (integer): Filter by publication year
- `keyword` (string): Filter by keyword
- `area` (string): Filter by research area
- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 100)
- `sort` (string: 'relevance', 'citations', 'year', 'title')

**Example:**

```
GET /papers/search?q=neural+networks&year=2020&sort=citations&page=1
```

#### GET /papers/:id

Get detailed information about a specific paper.

**Response:** 200 OK

```json
{
  "paper_id": 1,
  "title": "Attention Is All You Need",
  "abstract": "Full abstract text...",
  "year": 2017,
  "doi": "10.5555/3295222.3295349",
  "pdf_url": "https://arxiv.org/pdf/1706.03762.pdf",
  "full_text": null,
  "venue_id": 1,
  "venue_name": "NeurIPS",
  "venue_short_name": "NeurIPS",
  "venue_type": "conference",
  "publisher": "NeurIPS Foundation",
  "volume": null,
  "issue": null,
  "pages": "5998-6008",
  "citation_count": 50000,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "authors": [
    {
      "author_id": 1,
      "name": "Dr. Emily Chen",
      "affiliation": "Computer Science Dept",
      "orcid_id": "0000-0001-2345-6789",
      "order": 1
    }
  ],
  "keywords": ["deep learning", "neural networks", "transformers"],
  "research_areas": ["Machine Learning", "Natural Language Processing"]
}
```

#### GET /papers/:id/citations

Get citations for a paper.

**Query Parameters:**

- `type` (string: 'citing' or 'cited', default: 'cited')
  - `citing`: Papers that cite this paper
  - `cited`: Papers cited by this paper

**Response:** 200 OK

```json
{
  "type": "citing",
  "count": 150,
  "citations": [
    {
      "paper_id": 2,
      "title": "BERT: Pre-training of Deep...",
      "year": 2019,
      "citation_count": 35000,
      "citation_context": "Building upon the transformer architecture...",
      "authors": ["Author Name 1", "Author Name 2"]
    }
  ]
}
```

#### GET /papers/:id/comments

Get threaded comments for a paper.

**Response:** 200 OK

```json
[
  {
    "comment_id": 1,
    "user_id": 1,
    "user_name": "John Doe",
    "paper_id": 1,
    "comment_text": "Great paper!",
    "created_at": "2024-01-15T10:30:00.000Z",
    "parent_comment_id": null,
    "depth": 0
  },
  {
    "comment_id": 2,
    "user_id": 2,
    "user_name": "Jane Smith",
    "paper_id": 1,
    "comment_text": "I agree!",
    "created_at": "2024-01-15T11:00:00.000Z",
    "parent_comment_id": 1,
    "depth": 1
  }
]
```

#### GET /papers/:id/recommendations

Get recommended papers based on similarity.

**Query Parameters:**

- `limit` (integer, default: 10)

**Response:** 200 OK

```json
[
  {
    "paper_id": 3,
    "title": "Related Paper Title",
    "year": 2019,
    "citation_count": 12000,
    "venue_name": "ICML",
    "authors": ["Author 1", "Author 2"],
    "common_keywords": 5,
    "citation_link": 1
  }
]
```

---

### Authors

#### GET /authors

Get all authors with pagination.

**Query Parameters:**

- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 100)
- `sort` (string: 'citations', 'h-index', 'name', 'papers')

**Response:** 200 OK

```json
{
  "authors": [
    {
      "author_id": 1,
      "name": "Dr. Emily Chen",
      "affiliation": "Computer Science Dept",
      "email": "emily.chen@mit.edu",
      "orcid_id": "0000-0001-2345-6789",
      "h_index": 45,
      "citation_count": 25000,
      "institution_name": "Massachusetts Institute of Technology",
      "institution_country": "USA",
      "research_areas": ["Machine Learning", "Deep Learning"],
      "paper_count": 78
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### GET /authors/search

Search authors by name, institution, or research area.

**Query Parameters:**

- `q` (string): Search query for author name
- `institution` (string): Filter by institution
- `area` (string): Filter by research area
- `page` (integer, default: 1)
- `limit` (integer, default: 20)

#### GET /authors/:id

Get detailed author profile.

**Response:** 200 OK

```json
{
  "author_id": 1,
  "name": "Dr. Emily Chen",
  "affiliation": "Computer Science Dept",
  "email": "emily.chen@mit.edu",
  "orcid_id": "0000-0001-2345-6789",
  "research_interests": "Machine Learning, Deep Learning",
  "h_index": 45,
  "citation_count": 25000,
  "institution_id": 1,
  "institution_name": "Massachusetts Institute of Technology",
  "institution_country": "USA",
  "institution_website": "https://mit.edu",
  "research_areas": ["Machine Learning", "Deep Learning", "AI"]
}
```

#### GET /authors/:id/papers

Get papers by a specific author.

**Query Parameters:**

- `page` (integer, default: 1)
- `limit` (integer, default: 20)

**Response:** 200 OK

```json
[
  {
    "paper_id": 1,
    "title": "Paper Title",
    "year": 2020,
    "citation_count": 500,
    "doi": "10.1234/example",
    "venue_name": "NeurIPS",
    "venue_type": "conference",
    "author_order": 1,
    "co_authors": [{ "author_id": 2, "name": "Co-Author Name", "order": 2 }]
  }
]
```

#### GET /authors/:id/co-authors

Get frequent collaborators of an author.

**Response:** 200 OK

```json
[
  {
    "author_id": 2,
    "name": "Prof. Michael Zhang",
    "affiliation": "AI Lab",
    "h_index": 52,
    "collaboration_count": 15
  }
]
```

---

### Library (Authenticated)

#### GET /library

Get user's personal library.

**Query Parameters:**

- `page` (integer, default: 1)
- `limit` (integer, default: 20)
- `sort` (string: 'recent', 'rating', 'title', 'year')

**Response:** 200 OK

```json
{
  "papers": [
    {
      "paper_id": 1,
      "title": "Paper Title",
      "abstract": "Abstract text...",
      "year": 2020,
      "citation_count": 500,
      "added_at": "2024-01-10T15:30:00.000Z",
      "user_notes": "Important for my research",
      "rating": 5,
      "venue_name": "NeurIPS",
      "authors": ["Author 1", "Author 2"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### POST /library

Add paper to library.

**Request Body:**

```json
{
  "paper_id": 1,
  "user_notes": "string (optional, max 5000 chars)",
  "rating": "integer (optional, 1-5)"
}
```

**Response:** 201 Created

#### PATCH /library/:paperId

Update library entry.

**Request Body:**

```json
{
  "user_notes": "string (optional)",
  "rating": "integer (optional, 1-5)"
}
```

#### DELETE /library/:paperId

Remove paper from library.

**Response:** 200 OK

#### GET /library/check/:paperId

Check if paper is in user's library.

**Response:** 200 OK

```json
{
  "in_library": true,
  "entry": {
    "user_id": 1,
    "paper_id": 1,
    "added_at": "2024-01-10T15:30:00.000Z",
    "user_notes": "Important paper",
    "rating": 5
  }
}
```

#### GET /library/stats

Get library statistics.

**Response:** 200 OK

```json
{
  "total_papers": 45,
  "rated_papers": 30,
  "average_rating": 4.2,
  "research_areas": ["Machine Learning", "NLP", "Computer Vision"]
}
```

---

### Comments (Authenticated for POST/PATCH/DELETE)

#### GET /comments/paper/:paperId

Get all comments for a paper (threaded).

#### POST /comments

Create a new comment.

**Request Body:**

```json
{
  "paper_id": 1,
  "comment_text": "string (required, 1-5000 chars)",
  "parent_comment_id": "integer (optional, for replies)"
}
```

#### PATCH /comments/:id

Update own comment.

**Request Body:**

```json
{
  "comment_text": "string (required)"
}
```

#### DELETE /comments/:id

Delete own comment or any comment (admin only).

#### GET /comments/user/me

Get current user's comments.

---

### Follows (Authenticated)

#### POST /follows/authors/:authorId

Follow an author.

#### DELETE /follows/authors/:authorId

Unfollow an author.

#### GET /follows/authors

Get list of followed authors.

#### GET /follows/authors/:authorId/check

Check if following an author.

**Response:** 200 OK

```json
{
  "is_following": true
}
```

#### POST /follows/venues/:venueId

Follow a venue.

#### DELETE /follows/venues/:venueId

Unfollow a venue.

#### GET /follows/venues

Get list of followed venues.

#### GET /follows/venues/:venueId/check

Check if following a venue.

#### GET /follows/feed

Get personalized feed of papers from followed authors/venues.

**Query Parameters:**

- `page` (integer, default: 1)
- `limit` (integer, default: 20)

**Response:** 200 OK

```json
[
  {
    "paper_id": 1,
    "title": "New Paper Title",
    "abstract": "Abstract...",
    "year": 2024,
    "citation_count": 10,
    "created_at": "2024-01-15T00:00:00.000Z",
    "venue_name": "ICML",
    "authors": ["Followed Author Name"],
    "follow_type": "author"
  }
]
```

---

## Error Codes

| Code | Description                             |
| ---- | --------------------------------------- |
| 200  | OK - Request successful                 |
| 201  | Created - Resource created              |
| 400  | Bad Request - Invalid input             |
| 401  | Unauthorized - Authentication required  |
| 403  | Forbidden - Insufficient permissions    |
| 404  | Not Found - Resource not found          |
| 409  | Conflict - Duplicate entry              |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error                   |

## Best Practices

1. **Always include error handling** in your client code
2. **Store JWT tokens securely** (httpOnly cookies in production)
3. **Implement retry logic** for failed requests
4. **Cache responses** when appropriate
5. **Use pagination** for large datasets
6. **Validate input** on client side before sending requests

## Examples

### JavaScript/Axios

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Search papers
const searchPapers = async (query) => {
  const response = await api.get("/papers/search", {
    params: { q: query, limit: 20 },
  });
  return response.data;
};

// Add to library
const addToLibrary = async (paperId, notes, rating) => {
  const response = await api.post("/library", {
    paper_id: paperId,
    user_notes: notes,
    rating: rating,
  });
  return response.data;
};
```

### cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Search papers
curl "http://localhost:5000/api/papers/search?q=machine+learning&limit=5"

# Add to library (authenticated)
curl -X POST http://localhost:5000/api/library \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"paper_id":1,"rating":5,"user_notes":"Great paper"}'
```
