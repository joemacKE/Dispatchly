FROM node:22-alpine

WORKDIR /app


# Install dependencies

COPY package.json package-lock.json ./

RUN npm ci


# Copy application source

COPY src ./src

COPY migrations ./migrations

COPY tsconfig.json ./


EXPOSE 3000


CMD ["npm", "run", "dev"]