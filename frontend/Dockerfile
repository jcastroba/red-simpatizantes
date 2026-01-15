# Frontend Dockerfile - Multi-stage build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Expose port (Railway uses dynamic PORT)
EXPOSE 80

# Default port if not set
ENV PORT=80

# Replace PORT in nginx config and start
CMD ["/bin/sh", "-c", "sed -i \"s/\\${PORT}/$PORT/g\" /etc/nginx/conf.d/default.conf.template && mv /etc/nginx/conf.d/default.conf.template /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
