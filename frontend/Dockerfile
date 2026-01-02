FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app
COPY . .

# Run dev server
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
