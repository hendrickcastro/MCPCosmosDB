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

A comprehensive **Model Context Protocol (MCP)** server for **Azure CosmosDB** database operations. This server provides **12 powerful tools** for document database analysis, container discovery, data querying, and CRUD operations through the MCP protocol.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Azure CosmosDB database with connection string
- MCP-compatible client (Claude Desktop, Cursor IDE, etc.)

## ⚙️ Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OCONNSTRING` | CosmosDB connection string from Azure Portal | `AccountEndpoint=https://...;AccountKey=...;` |
| `COSMOS_DATABASE_ID` | Database ID to connect to | `MyDatabase` |

### 🔒 Security Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_ALLOW_MODIFICATIONS` | Enable/disable write operations (create, update, delete, upsert) | `false` |

> ⚠️ **IMPORTANT**: By default, all write operations are **DISABLED** for safety. Set `DB_ALLOW_MODIFICATIONS=true` only when you need to perform write operations.

### Installation Options

#### Option 1: NPX from npm Registry (Recommended) ✅
No installation needed! Configure your MCP client:

**Read-Only Mode (Default - Safe):**
```json
{
  "mcpServers": {
    "cosmosdb": {
      "command": "npx",
      "args": ["-y", "mcpcosmosdb@latest"],
      "env": {
        "OCONNSTRING": "AccountEndpoint=https://your-cosmos-account.documents.azure.com:443/;AccountKey=your-account-key-here;",
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
        "OCONNSTRING": "AccountEndpoint=https://your-cosmos-account.documents.azure.com:443/;AccountKey=your-account-key-here;",
        "COSMOS_DATABASE_ID": "your-database-name",
        "DB_ALLOW_MODIFICATIONS": "true"
      }
    }
  }
}
```

#### Option 2: NPX from GitHub
```json
{
  "mcpServers": {
    "cosmosdb": {
      "command": "npx",
      "args": ["-y", "hendrickcastro/MCPCosmosDB"],
      "env": {
        "OCONNSTRING": "AccountEndpoint=https://...;AccountKey=...;",
        "COSMOS_DATABASE_ID": "your-database-name"
      }
    }
  }
}
```

#### Option 2: Local Development
```bash
git clone <your-repo-url>
cd MCPCosmosDB
npm install && npm run build
```

Then configure with local path:
```json
{
  "mcpServers": {
    "mcp-cosmosdb": {
      "command": "node",
      "args": ["path/to/MCPCosmosDB/dist/server.js"],
      "env": {
        "OCONNSTRING": "your-connection-string",
        "COSMOS_DATABASE_ID": "your-database-name"
      }
    }
  }
}
```

## 🛠️ Available Tools (12 Total)

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

### ✏️ Write Operations (Require `DB_ALLOW_MODIFICATIONS=true`)

| Tool | Description |
|------|-------------|
| `mcp_create_document` | Create a new document in a container |
| `mcp_update_document` | Update (replace) an existing document |
| `mcp_delete_document` | Delete a document from a container |
| `mcp_upsert_document` | Create or update a document (upsert operation) |

> 🛡️ **Security Note**: Write operations are blocked by default. If `DB_ALLOW_MODIFICATIONS` is not set to `true`, these operations will return an error message explaining how to enable them.

## 📋 Usage Examples

### Container Analysis
```typescript
// List all containers
const containers = await mcp_list_containers();

// Get container definition (partition key, indexing policy)
const containerDef = await mcp_get_container_definition({ 
  container_id: "users" 
});

// Get container statistics
const stats = await mcp_get_container_stats({ 
  container_id: "users",
  sample_size: 1000
});
```

### Querying Data
```typescript
// Execute SQL query with CosmosDB syntax
const result = await mcp_cosmos_query({
  container_id: "products",
  query: "SELECT * FROM c WHERE c.category = @category AND c.price > @minPrice",
  parameters: { category: "electronics", minPrice: 100 },
  max_items: 50
});

// Get documents with simple filters
const documents = await mcp_get_documents({
  container_id: "orders",
  filter_conditions: { status: "completed", year: 2024 },
  limit: 100
});
```

### Document Operations
```typescript
// Get specific document by ID
const document = await mcp_get_document_by_id({
  container_id: "users",
  document_id: "user-123",
  partition_key: "user-123"
});

// Analyze schema
const schema = await mcp_analyze_schema({
  container_id: "products",
  sample_size: 500
});
```

### CRUD Operations (Requires `DB_ALLOW_MODIFICATIONS=true`)
```typescript
// Create a new document
const created = await mcp_create_document({
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
  container_id: "users",
  document_id: "user-456",
  partition_key: "user-456"
});
```

### Optional Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `COSMOS_ENABLE_ENDPOINT_DISCOVERY` | Enable automatic endpoint discovery | `true` |
| `COSMOS_MAX_RETRY_ATTEMPTS` | Maximum retry attempts for requests | `9` |
| `COSMOS_MAX_RETRY_WAIT_TIME` | Maximum retry wait time (ms) | `30000` |
| `COSMOS_ENABLE_CROSS_PARTITION_QUERY` | Enable cross-partition queries | `true` |

### Configuration Examples

**Production Environment (Read-Only):**
```json
{
  "env": {
    "OCONNSTRING": "AccountEndpoint=https://mycompany-prod.documents.azure.com:443/;AccountKey=your-production-key;",
    "COSMOS_DATABASE_ID": "ProductionDB"
  }
}
```

**Development Environment (With Write Access):**
```json
{
  "env": {
    "OCONNSTRING": "AccountEndpoint=https://mycompany-dev.documents.azure.com:443/;AccountKey=your-dev-key;",
    "COSMOS_DATABASE_ID": "DevDB",
    "DB_ALLOW_MODIFICATIONS": "true"
  }
}
```

**CosmosDB Emulator (Local):**
```json
{
  "env": {
    "OCONNSTRING": "AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==;",
    "COSMOS_DATABASE_ID": "TestDB",
    "DB_ALLOW_MODIFICATIONS": "true"
  }
}
```

## 🚨 Troubleshooting

**Connection Issues:**
- **Invalid connection string**: Verify OCONNSTRING format includes AccountEndpoint and AccountKey
- **Database not found**: Check COSMOS_DATABASE_ID matches existing database
- **Request timeout**: Increase COSMOS_MAX_RETRY_WAIT_TIME or check network

**Query Issues:**
- **Cross partition query required**: Set `enable_cross_partition: true` in query parameters
- **Query timeout**: Reduce sample sizes or add specific filters
- **Partition key required**: Specify partition_key for single-partition operations

**Write Operation Blocked:**
- **Error: "Database modifications are disabled"**: Set `DB_ALLOW_MODIFICATIONS=true` in your environment configuration
- This is a safety feature - write operations are disabled by default

**CosmosDB Emulator:**
1. Install Azure CosmosDB Emulator
2. Start emulator on port 8081
3. Use default emulator connection string
4. Create database and containers for testing

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
├── db.ts                     # CosmosDB connection & security
├── server.ts                 # MCP server setup
└── tools.ts                  # Tool definitions
```

**Key Features:**
- ⚡ Connection management with retry logic
- 🛡️ Comprehensive error handling
- 🔒 Write operation protection (DB_ALLOW_MODIFICATIONS)
- 📊 Performance metrics and request charges
- 🔧 Environment-based configuration
- 📋 Intelligent schema analysis

## 📝 Important Notes

- **Container IDs**: Use exact names as in CosmosDB
- **Partition Keys**: Required for optimal performance and CRUD operations
- **Cross-Partition Queries**: Can be expensive; use filters
- **Request Charges**: Monitor RU consumption
- **Security**: Store connection strings securely
- **Write Protection**: Enable `DB_ALLOW_MODIFICATIONS` only when needed

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

**Database:** `cosmosdb` `azure-cosmosdb` `nosql` `document-database` `database-analysis` `database-tools` `azure` `database-management` `database-operations` `data-analysis`

**MCP & AI:** `model-context-protocol` `mcp-server` `mcp-tools` `ai-tools` `claude-desktop` `cursor-ide` `anthropic` `llm-integration` `ai-database` `intelligent-database`

**Technology:** `typescript` `nodejs` `npm-package` `cli-tool` `database-client` `nosql-client` `database-sdk` `rest-api` `json-api` `database-connector`

**Features:** `container-analysis` `document-operations` `sql-queries` `schema-analysis` `query-execution` `database-search` `data-exploration` `database-insights` `partition-management` `throughput-analysis` `crud-operations` `document-crud`

**Use Cases:** `database-development` `data-science` `business-intelligence` `database-migration` `schema-documentation` `performance-analysis` `data-governance` `database-monitoring` `troubleshooting` `automation`

## 🙏 Acknowledgments

- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- [@azure/cosmos](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/cosmosdb/cosmos)
- Inspired by [MCPQL](https://github.com/hendrickcastro/MCPQL)

**🎯 MCP CosmosDB provides comprehensive Azure CosmosDB database analysis through the Model Context Protocol. Perfect for developers and data analysts working with CosmosDB!** 🚀
