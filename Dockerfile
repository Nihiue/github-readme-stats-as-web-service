FROM node:16

WORKDIR /app

COPY . .

RUN npm install

ENTRYPOINT ["node",  "index.js"]

EXPOSE 3000