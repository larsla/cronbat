# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
COPY --from=build /app/build /usr/share/nginx/html

# Create a custom nginx.conf that uses a higher port number (non-privileged)
RUN echo 'server {\n\
    listen 8080;\n\
    server_name localhost;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

# Create a non-root user for nginx
RUN addgroup -g 1000 -S cronbat && \
    adduser -u 1000 -S cronbat -G cronbat

# Set proper permissions
RUN chown -R cronbat:cronbat /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R cronbat:cronbat /var/cache/nginx && \
    chown -R cronbat:cronbat /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R cronbat:cronbat /var/run/nginx.pid

# Switch to non-root user
USER cronbat

# Expose port 8080 instead of 80
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
