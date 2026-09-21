FROM node:24-alpine

RUN apk add --no-cache git

WORKDIR /app

COPY gateway/package*.json ./
RUN npm install
RUN npm install pg express

COPY . .
# Compile the constitutional authorities (single source of truth for identity
# IDs and canonical hashing) for the gateway social routes. The gateway
# never reimplements identity or hash authority in JS.
RUN npm install --no-save typescript @types/node && \
    ./node_modules/.bin/tsc runtime/constitutional/src/identity-authority.ts runtime/constitutional/src/hash-authority.ts runtime/constitutional/src/ping-vocabulary.ts \
      --outDir gateway/constitutional-dist --module commonjs --target es2020 \
      --esModuleInterop --skipLibCheck --types node && \
    npm uninstall --no-save typescript @types/node

EXPOSE 8080

ENV NODE_ENV=production

CMD ["node", "gateway/server.js"]
