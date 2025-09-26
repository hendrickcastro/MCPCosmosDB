#!/bin/bash

# Script to ensure automatic installation and build
set -e

echo "🚀 Installing and building MCPCosmosDB..."

echo "Clearing npm and npx cache..."
npm cache clean --force
npx -y hendrickcastro/mcpcosmosdb --help

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "Installation and build completed successfully!"
