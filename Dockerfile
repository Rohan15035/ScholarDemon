# Multi-stage build for production
FROM node:18-alpine AS backend-build

WORKDIR /app

# Copy backend dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy backend code
COPY backend ./backend

# Frontend build stage
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy backend dependencies and code
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/package.json ./
COPY --from=backend-build /app/backend ./backend

# Copy frontend build
COPY --from=frontend-build /app/frontend/build ./frontend/build

EXPOSE 5000

CMD ["node", "backend/server.js"]
