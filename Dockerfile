FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy app source
COPY . .

# Build the app
RUN npm run build

# Install Docker CLI
RUN apk add --no-cache docker

# Expose port
EXPOSE 3000

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DB_LOCATION=/data/db
ENV STACKS_DIR=/data/stacks

# Create volumes
VOLUME ["/data/db", "/data/stacks", "/var/run/docker.sock"]

# Start the app
CMD ["node", "./dist/server/entry.mjs"]
