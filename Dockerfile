FROM node:22.14.0-alpine

WORKDIR /app

RUN mkdir public

COPY package*.json ./

RUN npm install

VOLUME /app/public

COPY . .

CMD ["npm", "start"]