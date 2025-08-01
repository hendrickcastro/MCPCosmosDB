# MCP CosmosDB - Azure CosmosDB MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/hendrickcastro/MCPCosmosDB.svg)](https://github.com/hendrickcastro/MCPCosmosDB/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/hendrickcastro/MCPCosmosDB.svg)](https://github.com/hendrickcastro/MCPCosmosDB/issues)
[![GitHub forks](https://img.shields.io/github/forks/hendrickcastro/MCPCosmosDB.svg)](https://github.com/hendrickcastro/MCPCosmosDB/network)
[![Build Status](https://img.shields.io/github/actions/workflow/status/hendrickcastro/MCPCosmosDB/ci.yml?branch=main)](https://github.com/hendrickcastro/MCPCosmosDB/actions)
[![Coverage Status](https://img.shields.io/codecov/c/github/hendrickcastro/MCPCosmosDB)](https://codecov.io/gh/hendrickcastro/MCPCosmosDB)
[![Azure CosmosDB](https://img.shields.io/badge/Azure-CosmosDB-blue)](https://azure.microsoft.com/services/cosmos-db/)
[![MCP Protocol](https://img.shields.io/badge/MCP-Protocol-purple)](https://github.com/modelcontextprotocol/sdk)
[![MCP Protocol](https://img.shields.io/badge/MCP-Protocol-purple)](https://github.com/modelcontextprotocol/sdk)
[![Claude Desktop](https://img.shields.io/badge/Claude-Desktop-orange)](https://claude.ai/desktop)
[![Cursor IDE](https://img.shields.io/badge/Cursor-IDE-green)](https://cursor.sh/)
[![Trae AI](https://img.shields.io/badge/Trae%20AI-IDE-blue)](https://trae.ai/)

A comprehensive **Model Context Protocol (MCP)** server for **Azure CosmosDB** database operations. This server provides 8 powerful tools for document database analysis, container discovery, and data querying through the MCP protocol.

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

### Installation Options

#### Option 1: NPX (Recommended)
No installation needed! Configure your MCP client:

```json
{
  "mcpServers": {
    "mcp-cosmosdb": {
      "command": "npx",
      "args": ["-y", "hendrickcastro/MCPCosmosDB"],
      "env": {
        "OCONNSTRING": "AccountEndpoint=https://your-cosmos-account.documents.azure.com:443/;AccountKey=your-account-key-here;",
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

## 🛠️ Available Tools

MCP CosmosDB provides 8 comprehensive tools for Azure CosmosDB operations:

### 1. 🗄️ **List Databases** - `mcp_list_databases`
List all databases in the CosmosDB account.

### 2. 📦 **List Containers** - `mcp_list_containers`
List all containers in the current database.

### 3. 📋 **Container Information** - `mcp_container_info`
Get detailed information about a specific container including partition key, indexing policy, and throughput settings.

### 4. 📊 **Container Statistics** - `mcp_container_stats`
Get statistics about a container including document count, size estimation, and partition key distribution.

### 5. 🔍 **Execute SQL Query** - `mcp_execute_query`
Execute SQL queries against CosmosDB containers with parameters and performance metrics.

### 6. 📄 **Get Documents** - `mcp_get_documents`
Retrieve documents from containers with optional filtering and partition key targeting.

### 7. 🎯 **Get Document by ID** - `mcp_get_document_by_id`
Retrieve a specific document by its ID and partition key.

### 8. 🏗️ **Schema Analysis** - `mcp_analyze_schema`
Analyze document schema structure in containers to understand data patterns.

## 📋 Usage Examples

### Container Analysis
```typescript
// List all containers
const containers = await mcp_list_containers();

// Get container information
const containerInfo = await mcp_container_info({ 
  container_id: "users" 
});

// Get container statistics
const stats = await mcp_container_stats({ 
  container_id: "users",
  sample_size: 1000
});
```

### Querying Data
```typescript
// Execute SQL query
const result = await mcp_execute_query({
  container_id: "products",
  query: "SELECT * FROM c WHERE c.category = @category AND c.price > @minPrice",
  parameters: { "category": "electronics", "minPrice": 100 },
  max_items: 50
});

// Get documents with filters
const documents = await mcp_get_documents({
  container_id: "orders",
  filter_conditions: { "status": "completed", "year": 2024 },
  limit: 100
});
```

### Document Operations
```typescript
// Get specific document
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

### Optional Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `COSMOS_ENABLE_ENDPOINT_DISCOVERY` | Enable automatic endpoint discovery | `true` |
| `COSMOS_MAX_RETRY_ATTEMPTS` | Maximum retry attempts for requests | `9` |
| `COSMOS_MAX_RETRY_WAIT_TIME` | Maximum retry wait time (ms) | `30000` |
| `COSMOS_ENABLE_CROSS_PARTITION_QUERY` | Enable cross-partition queries | `true` |

### Configuration Examples

**Production Environment:**
```json
{
  "env": {
    "OCONNSTRING": "AccountEndpoint=https://mycompany-prod.documents.azure.com:443/;AccountKey=your-production-key;",
    "COSMOS_DATABASE_ID": "ProductionDB"
  }
}
```

**CosmosDB Emulator (Local):**
```json
{
  "env": {
    "OCONNSTRING": "AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==;",
    "COSMOS_DATABASE_ID": "TestDB"
  }
}
```

**Advanced Configuration:**
```json
{
  "env": {
    "OCONNSTRING": "AccountEndpoint=https://mycompany.documents.azure.com:443/;AccountKey=your-key;",
    "COSMOS_DATABASE_ID": "MyDatabase",
    "COSMOS_MAX_RETRY_ATTEMPTS": "15",
    "COSMOS_MAX_RETRY_WAIT_TIME": "60000"
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
│   ├── dataOperations.ts     # Data queries
│   └── types.ts              # Type definitions
├── db.ts                     # CosmosDB connection
├── server.ts                 # MCP server setup
└── tools.ts                  # Tool definitions
```

**Key Features:**
- ⚡ Connection management with retry logic
- 🛡️ Comprehensive error handling
- 📊 Performance metrics and request charges
- 🔧 Environment-based configuration
- 📋 Intelligent schema analysis

## 📝 Important Notes

- **Container IDs**: Use exact names as in CosmosDB
- **Partition Keys**: Required for optimal performance
- **Cross-Partition Queries**: Can be expensive; use filters
- **Request Charges**: Monitor RU consumption
- **Security**: Store connection strings securely

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

**Features:** `container-analysis` `document-operations` `sql-queries` `schema-analysis` `query-execution` `database-search` `data-exploration` `database-insights` `partition-management` `throughput-analysis`

**Use Cases:** `database-development` `data-science` `business-intelligence` `database-migration` `schema-documentation` `performance-analysis` `data-governance` `database-monitoring` `troubleshooting` `automation`

## 🙏 Acknowledgments

- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- [@azure/cosmos](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/cosmosdb/cosmos)
- Inspired by [MCPQL](https://github.com/hendrickcastro/MCPQL)

**🎯 MCP CosmosDB provides comprehensive Azure CosmosDB database analysis through the Model Context Protocol. Perfect for developers and data analysts working with CosmosDB!** 🚀