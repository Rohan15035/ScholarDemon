import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/me"),
  updateProfile: (data) => api.patch("/auth/me", data),
  changePassword: (data) => api.post("/auth/change-password", data),
};

// Papers API
export const papersAPI = {
  getAll: (params) => api.get("/papers", { params }),
  search: (params) => api.get("/papers/search", { params }),
  getById: (id) => api.get(`/papers/${id}`),
  getCitations: (id, type) =>
    api.get(`/papers/${id}/citations`, { params: { type } }),
  getComments: (id) => api.get(`/papers/${id}/comments`),
  getRecommendations: (id, limit) =>
    api.get(`/papers/${id}/recommendations`, { params: { limit } }),
};

// Authors API
export const authorsAPI = {
  getAll: (params) => api.get("/authors", { params }),
  search: (params) => api.get("/authors/search", { params }),
  getById: (id) => api.get(`/authors/${id}`),
  getPapers: (id, params) => api.get(`/authors/${id}/papers`, { params }),
  getCoAuthors: (id) => api.get(`/authors/${id}/co-authors`),
};

// Library API
export const libraryAPI = {
  getAll: (params) => api.get("/library", { params }),
  add: (data) => api.post("/library", data),
  update: (paperId, data) => api.patch(`/library/${paperId}`, data),
  remove: (paperId) => api.delete(`/library/${paperId}`),
  check: (paperId) => api.get(`/library/check/${paperId}`),
  getStats: () => api.get("/library/stats"),
};

// Comments API
export const commentsAPI = {
  getByPaper: (paperId) => api.get(`/comments/paper/${paperId}`),
  create: (data) => api.post("/comments", data),
  update: (id, data) => api.patch(`/comments/${id}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
  getUserComments: () => api.get("/comments/user/me"),
};

// Follows API
export const followsAPI = {
  followAuthor: (authorId) => api.post(`/follows/authors/${authorId}`),
  unfollowAuthor: (authorId) => api.delete(`/follows/authors/${authorId}`),
  getFollowedAuthors: () => api.get("/follows/authors"),
  checkAuthor: (authorId) => api.get(`/follows/authors/${authorId}/check`),

  followVenue: (venueId) => api.post(`/follows/venues/${venueId}`),
  unfollowVenue: (venueId) => api.delete(`/follows/venues/${venueId}`),
  getFollowedVenues: () => api.get("/follows/venues"),
  checkVenue: (venueId) => api.get(`/follows/venues/${venueId}/check`),

  getFeed: (params) => api.get("/follows/feed", { params }),
};

export default api;
