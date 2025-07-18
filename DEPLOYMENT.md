# Deployment Guide - MCP CosmosDB

## Para publicar y permitir el uso con npx

### 1. Preparar el repositorio en GitHub

1. Crear un repositorio en GitHub (ej: `hendrickcastro/MCPCosmosDB`)
2. Subir todo el código al repositorio
3. Asegurarse de que el proyecto se compile correctamente

### 2. Publicar en npm (Método Recomendado)

```bash
# 1. Hacer login en npm
npm login

# 2. Compilar el proyecto
npm run build

# 3. Publicar a npm
npm publish
```

Una vez publicado en npm, los usuarios podrán usar:
```json
{
  "mcp-cosmosdb": {
    "command": "npx",
    "args": ["-y", "hendrickcastro/MCPCosmosDB"]
  }
}
```

### 3. Usar directamente desde GitHub (Alternativo)

Si no quieres publicar en npm, también se puede usar directamente desde GitHub:

```json
{
  "mcp-cosmosdb": {
    "command": "npx",
    "args": ["-y", "github:hendrickcastro/MCPCosmosDB"]
  }
}
```

### 4. Verificar la configuración

Para verificar que funciona correctamente:

```bash
# Probar localmente
npx hendrickcastro/MCPCosmosDB

# O desde GitHub
npx github:hendrickcastro/MCPCosmosDB
```

### 5. Configuración de ejemplo completa

**Para Cursor IDE (`~/.cursor/mcp.json`):**
```json
{
  "mcp-cosmosdb": {
    "command": "npx",
    "args": [
      "-y",
      "hendrickcastro/MCPCosmosDB"
    ],
    "description": "Servidor MCP para interactuar con Azure CosmosDB.",
    "disabled": false,
    "env": {
      "OCONNSTRING": "AccountEndpoint=https://your-cosmos-account.documents.azure.com:443/;AccountKey=your-account-key;",
      "COSMOS_DATABASE_ID": "your-database-name"
    }
  }
}
```

**Para Claude Desktop:**
```json
{
  "mcpServers": {
    "mcp-cosmosdb": {
      "command": "npx",
      "args": ["-y", "hendrickcastro/MCPCosmosDB"],
      "env": {
        "OCONNSTRING": "AccountEndpoint=https://your-cosmos-account.documents.azure.com:443/;AccountKey=your-account-key;",
        "COSMOS_DATABASE_ID": "your-database-name"
      }
    }
  }
}
```

### Notas importantes:

1. **Shebang**: El archivo `dist/server.js` debe tener `#!/usr/bin/env node` al inicio
2. **Permisos**: El archivo debe ser ejecutable
3. **Dependencies**: Todas las dependencias deben estar en `dependencies`, no en `devDependencies`
4. **Build**: El proyecto debe compilarse automáticamente en `npm install` con el script `prepare` 