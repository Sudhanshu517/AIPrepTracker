# -------------------------
# 1. Base image with Chromium dependencies
# -------------------------
FROM ghcr.io/puppeteer/puppeteer:24.33.0

# Install system dependencies required by Chromium
RUN apt-get update && \
    apt-get install -y \
    chromium \
    chromium-common \
    chromium-driver \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libxcursor1 \
    libxdamage1 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# -------------------------
# 2. Set working directory
# -------------------------
WORKDIR /app

# -------------------------
# 3. Copy package files first (for caching)
# -------------------------
COPY package*.json ./
RUN npm ci

# -------------------------
# 4. Install dependencies
# -------------------------
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install

# -------------------------
# 5. Copy source code 
# -------------------------
COPY . .

# -------------------------
# 6. Build client (Vite) + bundle server
# -------------------------
RUN npm run build

# -------------------------
# 7. Expose port Render will use
# -------------------------
EXPOSE 5000

# -------------------------
# 8. Run in production mode
# -------------------------
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

CMD ["npm", "start"]
