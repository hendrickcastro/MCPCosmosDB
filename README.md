# MCP CosmosDB - Azure CosmosDB MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/mcpcosmosdb.svg)](https://www.npmjs.com/package/mcpcosmosdb)
[![Downloads](https://img.shields.io/npm/dm/mcpcosmosdb.svg)](https://www.npmjs.com/package/mcpcosmosdb)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/hendrickcastro/MCPCosmosDB.svg)](https://github.com/hendrickcastro/MCPCosmosDB/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/hendrickcastro/MCPCosmosDB.svg)](https://github.com/hendrickcastro/MCPCosmosDB/issues)
[![GitHub forks](https://img.shields.io/github/forks/hendrickcastro/MCPCosmosDB.svg)](https://github.com/hendrickcastro/MCPCosmosDB/network)
[![Build Status](https://img.shields.io/github/actions/workflow/status/hendrickcastro/MCPCosmosDB/ci.yml?branch=main)](https://github.com/hendrickcastro/MCPCosmosDB/actions)
[![Coverage Status](https://img.shields.io/codecov/c/github/hendrickcastro/MCPCosmosDB)](https://codecov.io/gh/hendrickcastro/MCPCosmosDB)
[![Azure CosmosDB](https://img.shields.io/badge/Azure-CosmosDB-blue)](https://azure.microsoft.com/services/cosmos-db/)
[![MCP Protocol](https://img.shields.io/badge/MCP-Protocol-purple)](https://github.com/modelcontextprotocol/sdk)
[![Claude Desktop](https://img.shields.io/badge/Claude-Desktop-orange)](https://claude.ai/desktop)
[![Cursor IDE](https://img.shields.io/badge/Cursor-IDE-green)](https://cursor.sh/)
[![Trae AI](https://img.shields.io/badge/Trae%20AI-IDE-blue)](https://trae.ai/)

A comprehensive **Model Context Protocol (MCP)** server for **Azure CosmosDB** database operations. This server provides **13 powerful tools** for document database analysis, container discovery, data querying, and CRUD operations through the MCP protocol.

## ✨ Features

- 🔗 **Multi-Connection Support**: Manage multiple CosmosDB accounts/databases from a single MCP instance
- 🔒 **Security First**: Write operations disabled by default
- ⚡ **High Performance**: Connection caching and optimized queries
- 📊 **13 Tools**: Complete set of database operations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Azure CosmosDB database with connection string
- MCP-compatible client (Claude Desktop, Cursor IDE, etc.)

## ⚙️ Configuration

### Configuration Priority

The server supports three configuration methods (in order of priority):

| Priority | Method | Environment Variable | Description |
|----------|--------|---------------------|-------------|
| 1️⃣ | **External File** | `COSMOS_CONNECTIONS_FILE` | Path to JSON file with connections array |
| 2️⃣ | **JSON String** | `COSMOS_CONNECTIONS` | Inline JSON array of connections |
| 3️⃣ | **Single Connection** | `COSMOS_CONNECTION_STRING` + `COSMOS_DATABASE_ID` | Legacy single connection mode |

### 🔒 Security Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_ALLOW_MODIFICATIONS` | Enable/disable write operations (create, update, delete, upsert) | `false` |

> ⚠️ **IMPORTANT**: By default, all write operations are **DISABLED** for safety. Set `DB_ALLOW_MODIFICATIONS=true` only when you need to perform write operations.

---

## 📦 Installation Options

### Option 1: Multi-Connection with External File (Recommended) ✅

Create a connections file (e.g., `cosmos-connections.json`):

```json
[
  {
    "id": "production",
    "connectionString": "AccountEndpoint=https://myapp-prod.documents.azure.com:443/;AccountKey=...;",
    "databaseId": "ProductionDB",
    "allowModifications": false,
    "description": "Production database (read-only)"
  },
  {
    "id": "development",
    "connectionString": "AccountEndpoint=https://myapp-dev.documents.azure.com:443/;AccountKey=...;",
    "databaseId": "DevDB",
    "allowModifications": true,
    "description": "Development database"
  },
  {
    "id": "analytics",
    "connectionString": "AccountEndpoint=https://analytics.documents.azure.com:443/;AccountKey=...;",
    "databaseId": "AnalyticsDB",
    "allowModifications": false,
    "description": "Analytics database"
  }
]
```

Configure your MCP client:

```json
{
  "mcpServers": {
    "cosmosdb": {
      "command": "npx",
      "args": ["-y", "mcpcosmosdb@latest"],
      "env": {
        "COSMOS_CONNECTIONS_FILE": "/path/to/cosmos-connections.json"
      }
    }
  }
}
```

### Option 2: Multi-Connection with Inline JSON

```json
{
  "mcpServers": {
    "cosmosdb": {
      "command": "npx",
      "args": ["-y", "mcpcosmosdb@latest"],
      "env": {
        "COSMOS_CONNECTIONS": "[{\"id\":\"prod\",\"connectionString\":\"AccountEndpoint=https://...\",\"databaseId\":\"ProdDB\",\"allowModifications\":false},{\"id\":\"dev\",\"connectionString\":\"AccountEndpoint=https://...\",\"databaseId\":\"DevDB\",\"allowModifications\":true}]"
      }
    }
  }
}
```

### Option 3: Single Connection (Legacy)

**Read-Only Mode (Default - Safe):**
```json
{
  "mcpServers": {
    "cosmosdb": {
      "command": "npx",
      "args": ["-y", "mcpcosmosdb@latest"],
      "env": {
        "COSMOS_CONNECTION_STRING": "AccountEndpoint=https://your-cosmos-account.documents.azure.com:443/;AccountKey=your-account-key-here;",
        "COSMOS_DATABASE_ID": "your-database-name"
      }
    }
  }
}
```

**With Write Operations Enabled:**
```json
{
  "mcpServers": {
    "cosmosdb": {
      "command": "npx",
      "args": ["-y", "mcpcosmosdb@latest"],
      "env": {
        "COSMOS_CONNECTION_STRING": "AccountEndpoint=https://your-cosmos-account.documents.azure.com:443/;AccountKey=your-account-key-here;",
        "COSMOS_DATABASE_ID": "your-database-name",
        "DB_ALLOW_MODIFICATIONS": "true"
      }
    }
  }
}
```

### Option 4: NPX from GitHub

```json
{
  "mcpServers": {
    "cosmosdb": {
      "command": "npx",
      "args": ["-y", "hendrickcastro/MCPCosmosDB"],
      "env": {
        "COSMOS_CONNECTION_STRING": "AccountEndpoint=https://...;AccountKey=...;",
        "COSMOS_DATABASE_ID": "your-database-name"
      }
    }
  }
}
```

### Option 5: Local Development

```bash
git clone https://github.com/hendrickcastro/MCPCosmosDB.git
cd MCPCosmosDB
npm install && npm run build
```

```json
{
  "mcpServers": {
    "cosmosdb": {
      "command": "node",
      "args": ["path/to/MCPCosmosDB/dist/server.js"],
      "env": {
        "COSMOS_CONNECTIONS_FILE": "/path/to/cosmos-connections.json"
      }
    }
  }
}
```

---

## 🛠️ Available Tools (13 Total)

### 🔗 Connection Management

| Tool | Description |
|------|-------------|
| `mcp_list_connections` | List all configured connections with their status |

### 📖 Read Operations (Always Available)

| Tool | Description |
|------|-------------|
| `mcp_list_databases` | List all databases in the CosmosDB account |
| `mcp_list_containers` | List all containers in the current database |
| `mcp_get_container_definition` | Get detailed container configuration (partition key, indexing policy, throughput) |
| `mcp_get_container_stats` | Get container statistics (document count, size, partition distribution) |
| `mcp_cosmos_query` | Execute SQL queries with parameters and performance metrics |
| `mcp_get_documents` | Retrieve documents with optional filtering |
| `mcp_get_document_by_id` | Get a specific document by ID and partition key |
| `mcp_analyze_schema` | Analyze document schema structure in containers |

### ✏️ Write Operations (Require `allowModifications: true`)

| Tool | Description |
|------|-------------|
| `mcp_create_document` | Create a new document in a container |
| `mcp_update_document` | Update (replace) an existing document |
| `mcp_delete_document` | Delete a document from a container |
| `mcp_upsert_document` | Create or update a document (upsert operation) |

> 🛡️ **Security Note**: Write operations are blocked by default. Set `allowModifications: true` in the connection config or `DB_ALLOW_MODIFICATIONS=true` for single connection mode.

---

## 📋 Usage Examples

### Multi-Connection Usage

```typescript
// List all available connections
const connections = await mcp_list_connections();
// Returns: { connections: [{id: "prod", databaseId: "ProdDB", isConnected: true}, ...] }

// Query specific connection using connection_id
const prodData = await mcp_cosmos_query({
  connection_id: "production",
  container_id: "users",
  query: "SELECT TOP 10 c.id, c.name FROM c ORDER BY c._ts DESC"
});

const devData = await mcp_cosmos_query({
  connection_id: "development",
  container_id: "users",
  query: "SELECT TOP 10 c.id, c.name FROM c ORDER BY c._ts DESC"
});
```

### Container Analysis

```typescript
// List all containers (uses default connection if connection_id not specified)
const containers = await mcp_list_containers({
  connection_id: "production"
});

// Get container definition
const containerDef = await mcp_get_container_definition({ 
  connection_id: "production",
  container_id: "users" 
});

// Get container statistics
const stats = await mcp_get_container_stats({ 
  connection_id: "production",
  container_id: "users",
  sample_size: 1000
});
```

### Querying Data

⚠️ **IMPORTANT**: Always use `TOP N` and specify fields. **NEVER use `SELECT *`** - it causes timeouts and high RU consumption in large containers.

```typescript
// ✅ CORRECT: Using TOP and specific fields
const result = await mcp_cosmos_query({
  connection_id: "production",
  container_id: "products",
  query: "SELECT TOP 50 c.id, c.name, c.price FROM c WHERE c.category = @category",
  parameters: { category: "electronics" }
});

// ❌ WRONG: SELECT * without TOP (will timeout on large containers)
// query: "SELECT * FROM c WHERE c.category = @category"

// Get documents with simple filters
const documents = await mcp_get_documents({
  connection_id: "production",
  container_id: "orders",
  filter_conditions: { status: "completed" },
  order_by: "_ts",
  order_direction: "DESC",
  limit: 100
});
```

### Document Operations

```typescript
// Get specific document by ID
const document = await mcp_get_document_by_id({
  connection_id: "production",
  container_id: "users",
  document_id: "user-123",
  partition_key: "user-123"
});

// Analyze schema
const schema = await mcp_analyze_schema({
  connection_id: "production",
  container_id: "products",
  sample_size: 500
});
```

### CRUD Operations (Requires `allowModifications: true`)

```typescript
// Create a new document
const created = await mcp_create_document({
  connection_id: "development",  // Use a connection with write access
  container_id: "users",
  document: {
    id: "user-456",
    email: "user@example.com",
    name: "John Doe",
    status: "active"
  },
  partition_key: "user-456"
});

// Update a document (full replacement)
const updated = await mcp_update_document({
  connection_id: "development",
  container_id: "users",
  document_id: "user-456",
  document: {
    id: "user-456",
    email: "newemail@example.com",
    name: "John Doe",
    status: "inactive"
  },
  partition_key: "user-456"
});

// Upsert a document (create or update)
const upserted = await mcp_upsert_document({
  connection_id: "development",
  container_id: "users",
  document: {
    id: "user-789",
    email: "another@example.com",
    name: "Jane Doe"
  },
  partition_key: "user-789"
});

// Delete a document
const deleted = await mcp_delete_document({
  connection_id: "development",
  container_id: "users",
  document_id: "user-456",
  partition_key: "user-456"
});
```

---

## 🔧 Connection File Schema

```typescript
interface ConnectionConfig {
  id: string;                    // Unique identifier for the connection
  connectionString: string;      // CosmosDB connection string
  databaseId: string;            // Database ID to connect to
  allowModifications?: boolean;  // Enable write operations (default: false)
  description?: string;          // Optional description
}
```

**Example `cosmos-connections.json`:**

```json
[
  {
    "id": "athlete",
    "connectionString": "AccountEndpoint=https://dbsqlcosmosathlete.documents.azure.com:443/;AccountKey=...;",
    "databaseId": "data",
    "allowModifications": false,
    "description": "Athlete data"
  },
  {
    "id": "events",
    "connectionString": "AccountEndpoint=https://dbsqlcosmosevents.documents.azure.com:443/;AccountKey=...;",
    "databaseId": "events",
    "allowModifications": false,
    "description": "Events data"
  }
]
```

---

## 🚨 Troubleshooting

**Connection Issues:**
- **Invalid connection string**: Verify connection string format includes AccountEndpoint and AccountKey
- **Database not found**: Check databaseId matches existing database
- **Request timeout**: Increase COSMOS_MAX_RETRY_WAIT_TIME or check network

**Query Issues:**
- **Query timeout**: Use `TOP N` to limit results, specify only needed fields, avoid `SELECT *`
- **Cross partition query required**: Set `enable_cross_partition: true` in query parameters
- **Partition key required**: Specify partition_key for single-partition operations

**Multi-Connection Issues:**
- **Connection not found**: Use `mcp_list_connections` to see available connection IDs
- **Wrong database**: Verify the `connection_id` parameter points to the correct connection

**Write Operation Blocked:**
- **Error: "Database modifications are disabled"**: Set `allowModifications: true` in connection config or `DB_ALLOW_MODIFICATIONS=true`
- This is a safety feature - write operations are disabled by default

**CosmosDB Emulator:**
1. Install Azure CosmosDB Emulator
2. Start emulator on port 8081
3. Use default emulator connection string
4. Create database and containers for testing

---

## 🧪 Development

```bash
npm test          # Run tests
npm run build     # Build project
npm start         # Development mode
```

## 🏗️ Architecture

**Project Structure:**
```
src/
├── tools/                    # Tool implementations
│   ├── containerAnalysis.ts  # Container operations
│   ├── dataOperations.ts     # Data queries & CRUD
│   └── types.ts              # Type definitions
├── db.ts                     # CosmosDB connection & multi-connection management
├── server.ts                 # MCP server setup
└── tools.ts                  # Tool definitions
```

**Key Features:**
- ⚡ Connection caching and pooling
- 🔗 Multi-connection management
- 🛡️ Comprehensive error handling
- 🔒 Write operation protection per connection
- 📊 Performance metrics and request charges
- 🔧 Flexible configuration options
- 📋 Intelligent schema analysis

---

## 📝 Important Notes

- **Query Best Practices**: Always use `TOP N` and specify fields - never use `SELECT *`
- **Container IDs**: Use exact names as in CosmosDB
- **Partition Keys**: Required for optimal performance and CRUD operations
- **Cross-Partition Queries**: Can be expensive; use filters
- **Request Charges**: Monitor RU consumption
- **Security**: Store connection strings securely (use external file)
- **Write Protection**: Enable only for connections that need it

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Make changes and add tests
4. Ensure tests pass (`npm test`)
5. Commit changes (`git commit -m 'Add feature'`)
6. Push and open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🏷️ Tags & Keywords

**Database:** `cosmosdb` `azure-cosmosdb` `nosql` `document-database` `database-analysis` `database-tools` `azure` `database-management` `database-operations` `data-analysis` `multi-database`

**MCP & AI:** `model-context-protocol` `mcp-server` `mcp-tools` `ai-tools` `claude-desktop` `cursor-ide` `anthropic` `llm-integration` `ai-database` `intelligent-database`

**Technology:** `typescript` `nodejs` `npm-package` `cli-tool` `database-client` `nosql-client` `database-sdk` `rest-api` `json-api` `database-connector`

**Features:** `container-analysis` `document-operations` `sql-queries` `schema-analysis` `query-execution` `database-search` `data-exploration` `database-insights` `partition-management` `throughput-analysis` `crud-operations` `document-crud` `multi-connection`

**Use Cases:** `database-development` `data-science` `business-intelligence` `database-migration` `schema-documentation` `performance-analysis` `data-governance` `database-monitoring` `troubleshooting` `automation`

## 🙏 Acknowledgments

- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- [@azure/cosmos](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/cosmosdb/cosmos)
- Inspired by [MCPQL](https://github.com/hendrickcastro/MCPQL)

**🎯 MCP CosmosDB provides comprehensive Azure CosmosDB database analysis through the Model Context Protocol. Perfect for developers and data analysts working with CosmosDB!** 🚀
