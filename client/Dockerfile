FROM node:21-alpine3.18

WORKDIR /app/client

COPY package.json package-lock.json ./

RUN npm install --legacy-peer-deps

COPY . .

CMD ["npm", "run", "dev"]
