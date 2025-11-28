# Multi-stage Dockerfile for a Vite + React (TypeScript) app
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies (use package-lock.json if present)
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source and run build
COPY . .
RUN npm run build

# Production image: nginx serving the built files
FROM nginx:stable-alpine
# Ensure default content removed
RUN rm -rf /usr/share/nginx/html/*

# Configure nginx for SPA routing (fallback to index.html)
RUN mkdir -p /etc/nginx/conf.d && \
    printf 'server { \
      listen 80; \
      server_name localhost; \
      root /usr/share/nginx/html; \
      index index.html; \
      location / { \
        try_files $uri $uri/ /index.html; \
      } \
      location /_next/static/ { \
        access_log off; \
      } \
    }' > /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage (Vite outputs to dist/)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
