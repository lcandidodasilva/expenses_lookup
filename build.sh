#!/bin/bash
set -e

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Build Next.js
echo "Building Next.js..."
next build 