# FROM node:20-alpine

# WORKDIR /app

# COPY package*.json ./
# RUN npm install

# COPY . .

# EXPOSE 3000

# CMD ["node", "src/index.js"]

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD sh -c "npm run migrate && npm run seed && node src/index.js"