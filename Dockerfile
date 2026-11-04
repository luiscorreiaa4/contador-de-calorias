# API (backend). O front é publicado separadamente (ver frontend/public/_headers).
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY shared ./shared
RUN cd shared && npm ci --omit=dev
COPY backend/package*.json ./backend/
RUN cd backend && npm ci
COPY backend ./backend
USER node
WORKDIR /app/backend
EXPOSE 3001
CMD ["npm", "start"]
