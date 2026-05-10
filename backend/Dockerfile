FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm install --production=false
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["npx", "ts-node", "--transpile-only", "src/server.ts"]
