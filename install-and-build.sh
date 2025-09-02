#!/bin/bash

# Script para asegurar instalación y build automático
set -e

echo "🚀 Instalando y construyendo MCPCosmosDB..."

# Si estamos en el directorio del proyecto
if [ -f "package.json" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    
    echo "🔨 Construyendo proyecto..."
    npm run build
    
    echo "✅ Listo para usar!"
    
    # Ejecutar el servidor
    node dist/server.js
else
    echo "❌ Error: No se encontró package.json"
    exit 1
fi
