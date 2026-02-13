FROM node:18-alpine

WORKDIR /app

COPY package.json ./
# If package-lock.json doesn't exist yet, it's fine, npm install will generate it.
# We modify COPY to be safe if lock file is missing during first run, though usually good practice to have it.
# For initial scaffold, we might not have it. Let's just copy package.json first.
# COPY package*.json ./

COPY package.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]
