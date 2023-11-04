FROM node:18.17.0

WORKDIR /

COPY . .

EXPOSE 3000

CMD ["npm", "start"]