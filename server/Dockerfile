FROM node:21-alpine3.18

WORKDIR /app/server

COPY package.json .

RUN npm install --legacy-peer-deps

COPY . .

CMD ["npm", "run", "dev"]
