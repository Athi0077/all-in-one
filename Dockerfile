FROM node:18-alpine

WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm install --production

# Copy server source code
COPY server/ ./

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
