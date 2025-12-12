FROM ghcr.io/puppeteer/puppeteer:24.33.0

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

RUN mkdir -p /app && chown -R pptruser:pptruser /app

USER pptruser

COPY --chown=pptruser:pptruser package*.json ./

# Build-time Vite env
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

RUN npm install

COPY --chown=pptruser:pptruser . .

RUN npm run build

EXPOSE 5000

ENV NODE_ENV=production
# ✔ Correct Chromium path for this base image:
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

CMD ["npm", "start"]
