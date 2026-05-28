# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve to run the built app
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Copy serve configuration
COPY serve.json ./serve.json

# Expose port
EXPOSE 3000

# Start the app
CMD ["serve", "-c", "serve.json", "-l", "3000"]
