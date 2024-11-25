# Use Node.js LTS as the base image
FROM node:18-alpine
# FROM node:18-buster

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port for Vite
EXPOSE 8000

# Start the Vite dev server
CMD ["npm", "run", "dev", "--", "--host"]