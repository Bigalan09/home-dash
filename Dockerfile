# Use Bun runtime for the API backend
FROM oven/bun:1 AS runtime

# Set working directory
WORKDIR /app

# Copy package.json first for better caching
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY server.ts ./

# Expose the internal API port
EXPOSE 3001

# Start the API server
CMD ["bun", "run", "server.ts"]