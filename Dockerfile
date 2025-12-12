FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR usr/src//app

# Copy package files first (better caching)
COPY package*.json ./

RUN npm ci

# Skip puppeteer's built-in Chromium download
ENV PUPPETEER_SKIP_DOWNLOAD=true
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Build frontend + server
RUN npm run build

# Expose Render's port
EXPOSE 5000

# Environment settings
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Start server
CMD ["npm", "start"]
