# Build stage for Client
FROM node:20-alpine AS client-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:client

# Build stage for Server
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:server

# Final Production Image
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=client-builder /app/dist/spa ./dist/spa
COPY --from=server-builder /app/dist/server ./dist/server
COPY --from=server-builder /app/server ./server

EXPOSE 5000
CMD ["npm", "start"]
