#!/bin/bash

# Script para asegurar instalación y build automático
set -e

echo "🚀 Instalando y construyendo MCPCosmosDB..."

echo "Clearing npm and npx cache..."
npm cache clean --force
npx -y hendrickcastro/mcpcosmosdb --help

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "Installation and build completed successfully!"
