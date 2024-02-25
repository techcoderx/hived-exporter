# Base image with Node.js 20
FROM node:20-slim

# Set up the working directory for the app
WORKDIR /app

# Copy your project's files to the working directory
COPY . .

# Install pnpm
RUN npm install -g pnpm

# Install the dependencies using pnpm
RUN pnpm install

# Build the project
RUN pnpm run compile

# Expose exporter port
ENV HIVED_EXPORTER_PORT=8088
EXPOSE ${HIVED_EXPORTER_PORT}

# Define the command that should be executed
CMD ["node","dist/index.js"]