# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency specifications
COPY frontend/package*.json ./

# Install dependencies (using legacy peer deps for compatibility if needed)
RUN npm ci || npm install --legacy-peer-deps

# Copy frontend source files
COPY frontend/ ./

# Build production bundle
RUN npm run build

# Production serve stage with lightweight Nginx
FROM nginx:alpine

# Copy built static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for SPA routing and API proxy
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
