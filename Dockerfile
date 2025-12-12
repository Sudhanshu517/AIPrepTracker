FROM ghcr.io/puppeteer/puppeteer:24.33.0

# Skip Chromium download (Chromium already included)
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Set work directory
WORKDIR /app

# Make sure the non-root user can write to /app
RUN mkdir -p /app && chown -R pptruser:pptruser /app

# Use pptruser (required for Puppeteer)
USER pptruser

# Copy package files
COPY --chown=pptruser:pptruser package*.json ./

# Define build-time variables (important!)
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Install dependencies
RUN npm install

# Copy rest of the project
COPY --chown=pptruser:pptruser . .

# Build
RUN npm run build

# Expose port
EXPOSE 5000

# Production environment
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Start the server
CMD ["npm", "start"]
