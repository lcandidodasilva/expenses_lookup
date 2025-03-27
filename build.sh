#!/bin/bash
set -e

# Set environment to production
export NODE_ENV=production

# Load secure environment variables
echo "Setting up secure environment..."
node scripts/secure-environment.js

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Run database migrations for production
echo "Running database migrations..."
node scripts/db-migrate.js

# Build Next.js
echo "Building Next.js..."
next build

# Run performance optimizations
echo "Optimizing assets..."
# Add any additional optimization scripts here

echo "Build completed successfully!" 