# Multi-stage Dockerfile for a Vite + React (TypeScript) app
# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy package manifests first to leverage layer caching
COPY package*.json ./

# Install dependencies INCLUDING devDependencies so Vite (a devDependency) is available for the build.
# Do not set NODE_ENV=production before this step.
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
    }' > /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage (Vite outputs to dist/)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
