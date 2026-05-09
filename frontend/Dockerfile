FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["npx", "ts-node", "src/server.ts"]