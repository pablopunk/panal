FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy app source
COPY . .

# Build the app
RUN pnpm run build

# Install Docker CLI
RUN apk add --no-cache docker

# Expose port
EXPOSE 4321

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=4321
ENV DB_LOCATION=/data/db
ENV STACKS_DIR=/data/stacks

# Create volumes
VOLUME ["/data/db", "/data/stacks", "/var/run/docker.sock"]

# Start the app
CMD ["node", "./dist/server/entry.mjs"]
