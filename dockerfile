# Use Node.js LTS as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Install Tailwind
RUN npm install -D tailwindcss postcss autoprefixer
RUN npx tailwindcss init -p

# Expose the port for Vite
EXPOSE 5173

# Start the Vite dev server
CMD ["npm", "run", "dev", "--", "--host"]