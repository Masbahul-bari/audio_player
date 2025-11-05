FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy project files
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["pnpm", "dev"]

