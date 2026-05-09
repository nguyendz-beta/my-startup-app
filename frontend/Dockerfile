FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN apk add --no-cache bash
EXPOSE 8080
CMD sed -i "s/PORT_PLACEHOLDER/${PORT:-8080}/g" /etc/nginx/conf.d/default.conf && nginx -g "daemon off;"
