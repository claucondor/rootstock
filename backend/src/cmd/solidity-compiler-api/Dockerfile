# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json tsconfig.json hardhat.config.ts ./
COPY src ./src
RUN npm install && npm run build

# Create a stage to pre-download the Solidity compiler
FROM node:20-alpine AS compiler-cache
WORKDIR /app
COPY package.json hardhat.config.ts ./
RUN apk add --no-cache git python3 make g++ && \
    npm install && \
    # Create a simple contract to trigger compiler download
    mkdir -p contracts && \
    echo 'pragma solidity 0.8.29; contract Test {}' > contracts/Test.sol && \
    # Run hardhat compile to download the compiler
    npx hardhat compile

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=compiler-cache /app/node_modules/.cache/hardhat-nodejs /root/.cache/hardhat-nodejs
COPY package.json hardhat.config.ts ./
# Create contracts directory
RUN mkdir -p contracts
# Install production dependencies
RUN npm install --omit=dev --ignore-scripts && \
    # Install hardhat and related packages for compilation
    npm install --no-save hardhat@2.23.0 @nomiclabs/hardhat-ethers@2.2.3 ethers@5.8.0 @openzeppelin/contracts@5.3.0

# Set environment variables
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 8080

CMD ["node", "dist/cmd/solidity-compiler-api/index.js"]