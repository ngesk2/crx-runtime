FROM node:24-alpine

RUN apk add --no-cache git

WORKDIR /app

COPY gateway/package*.json ./
RUN npm install
RUN npm install pg express

COPY . .

EXPOSE 8080

ENV NODE_ENV=production

CMD ["node", "gateway/server.js"]
