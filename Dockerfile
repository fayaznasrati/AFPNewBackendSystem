# Step 1: Use official Node.js LTS image
FROM node:20-alpine

# Step 2: Set working directory
WORKDIR /usr/src/app

# Step 3: Copy package files first (for better caching)
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install --production

# Step 5: Copy project files
COPY . .

# Step 6: Expose application port (adjust if different)
EXPOSE 3000

# Step 7: Define environment variables
ENV NODE_ENV=production

# Step 8: Start app using PM2
RUN npm install pm2 -g
# CMD ["pm2-runtime", "ecosystem.config.js"]
CMD ["pm2-runtime", "src/server.js"]

