# ─────────────────────────────────────────────
#  Jean Baby – E-Commerce Platform
#  CAT-23708/2024 | Node.js + Express
# ─────────────────────────────────────────────
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm install --production

# Copy application source
COPY . .

# Create uploads directory
RUN mkdir -p public/uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

# Start the server
CMD ["node", "server/index.js"]
