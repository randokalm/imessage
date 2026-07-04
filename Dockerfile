# ---- 1. Aşama: Frontend'i build et ----
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- 2. Aşama: Backend'i hazırla ve frontend build'ini içine koy ----
FROM node:20-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Frontend'in dist klasörünü backend'in "public" klasörüne kopyala
COPY --from=frontend-build /app/frontend/dist ./public

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "index.js"]
