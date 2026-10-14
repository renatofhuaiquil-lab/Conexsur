# Imagen de la API (Node 22). Se ejecuta con un usuario sin privilegios.
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY db ./db
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "src/index.js"]
