FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY . .

EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "src/app.js"]
