FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .
RUN npm install typescript --no-save && npx tsc

RUN mkdir -p /data/sessions

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/index.js"]
