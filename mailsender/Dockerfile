# --- Stage 1: deps -------------------------------------------------
FROM node:21-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# --- Stage 2: prod -------------------------------------------------
FROM node:21-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5013
CMD ["node", "src/server.js"]