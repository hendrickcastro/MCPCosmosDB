// Common connection_id property for all tools
const connectionIdProperty = {
  connection_id: {
    type: "string",
    description: "ID of the connection to use. Use mcp_list_connections to see available connections. If not specified, uses the default connection."
  }
};

export const MCP_COSMOSDB_TOOLS = [
  // 0. List Available Connections - NEW!
  {
    name: "mcp_list_connections",
    description: "List all available CosmosDB connections configured in this MCP server. Use this to discover which connection_id values you can use. Each connection points to a different CosmosDB account/database.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },

  // 1. Database Operations
  {
    name: "mcp_list_databases",
    description: "List all databases in the CosmosDB account. Use this to discover available databases before querying containers. Returns database IDs, timestamps, and ETags.",
    inputSchema: {
      type: "object",
      properties: {
        ...connectionIdProperty
      },
      required: []
    }
  },

  // 2. Container Operations
  {
    name: "mcp_list_containers",
    description: "List all containers in the connected CosmosDB database. Use this to discover available containers and their partition key configurations before querying data. Returns container IDs, partition key paths, and indexing policies.",
    inputSchema: {
      type: "object",
      properties: {
        ...connectionIdProperty
      },
      required: []
    }
  },

  // 3. Container Information
  {
    name: "mcp_get_container_definition",
    description: "Get detailed configuration of a specific container including partition key, indexing policy, and throughput settings. Use this to understand the container structure before writing queries. Example: mcp_get_container_definition({container_id: 'users', connection_id: 'athlete'})",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID/name of the container (e.g., 'users', 'orders', 'products')"
        },
        ...connectionIdProperty
      },
      required: ["container_id"]
    }
  },

  // 4. Container Statistics
  {
    name: "mcp_get_container_stats",
    description: "Get statistical information about a container including document count, estimated size, and partition key distribution. Use this for capacity planning and performance analysis. Example: mcp_get_container_stats({container_id: 'orders', sample_size: 500})",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID/name of the container to analyze"
        },
        sample_size: {
          type: "number",
          description: "Number of documents to sample for statistics (default: 1000, higher = more accurate but slower)",
          default: 1000
        },
        ...connectionIdProperty
      },
      required: ["container_id"]
    }
  },

  // 5. Query Execution - Advanced SQL queries
  {
    name: "mcp_cosmos_query",
    description: `Execute a CosmosDB SQL query against a container. Use this for complex queries with JOINs, aggregations, or custom SQL syntax.

⚠️ IMPORTANT - AVOID SELECT *:
- NEVER use SELECT * in large containers - it causes timeouts and high RU consumption
- ALWAYS use TOP N to limit results: SELECT TOP 10 c.id, c.name FROM c
- ALWAYS specify only the fields you need: SELECT c.id, c.name, c.email FROM c

COSMOSDB SQL SYNTAX EXAMPLES:
- Basic: SELECT TOP 10 c.id, c.name FROM c WHERE c.status = @status
- With projection: SELECT c.id, c.name, c.email FROM c
- Aggregation: SELECT VALUE COUNT(1) FROM c
- Array contains: SELECT TOP 20 c.id FROM c WHERE ARRAY_CONTAINS(c.tags, 'urgent')
- Nested: SELECT TOP 10 c.id, c.address FROM c WHERE c.address.city = 'Madrid'
- ORDER BY: SELECT TOP 10 c.id, c._ts FROM c ORDER BY c._ts DESC

PARAMETERS: Use @paramName syntax and provide values in the 'parameters' object.
Example: query="SELECT TOP 10 c.id, c.type FROM c WHERE c.type = @type", parameters={type: "order"}`,
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID/name of the container to query"
        },
        query: {
          type: "string",
          description: "CosmosDB SQL query. Use 'c' as the alias for the container. ALWAYS use TOP N and specify fields - NEVER use SELECT *. Example: 'SELECT TOP 10 c.id, c.name FROM c WHERE c.active = true'"
        },
        parameters: {
          type: "object",
          description: "Query parameters as key-value pairs (without @ prefix). Example: {status: 'active', limit: 10}"
        },
        max_items: {
          type: "number",
          description: "Maximum number of items to return (default: 100, max recommended: 1000)",
          default: 100
        },
        enable_cross_partition: {
          type: "boolean",
          description: "Enable cross-partition queries. Set to true unless querying within a single partition key value.",
          default: true
        },
        ...connectionIdProperty
      },
      required: ["container_id", "query"]
    }
  },

  // 6. Get Documents - Simple filtering without SQL
  {
    name: "mcp_get_documents",
    description: `Get documents from a container with simple filters and ordering. Use this for basic queries without complex SQL syntax.

FOR COMPLEX QUERIES: Use mcp_cosmos_query instead.
THIS TOOL IS BEST FOR:
- Getting all documents (with limit)
- Simple equality filters on fields
- Filtering by partition key for performance
- Getting the most recent or oldest documents using order_by

Example: mcp_get_documents({container_id: 'users', limit: 10, order_by: '_ts', order_direction: 'DESC', connection_id: 'athlete'})
Example: mcp_get_documents({container_id: 'users', limit: 50, filter_conditions: {status: 'active'}})`,
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID/name of the container to query"
        },
        limit: {
          type: "number",
          description: "Maximum number of documents to return (default: 100)",
          default: 100
        },
        partition_key: {
          type: ["string", "number", "boolean"],
          description: "Optional partition key value to filter by. Improves performance significantly."
        },
        filter_conditions: {
          type: "object",
          description: "Simple equality filters as key-value pairs. Example: {status: 'active', type: 'premium'}"
        },
        order_by: {
          type: "string",
          description: "Field name to order results by. Use '_ts' for timestamp ordering (most recent/oldest). Example: '_ts', 'creationDate', 'name'"
        },
        order_direction: {
          type: "string",
          enum: ["ASC", "DESC"],
          description: "Sort direction: 'ASC' for ascending (oldest first), 'DESC' for descending (newest first). Default: 'ASC'",
          default: "ASC"
        },
        ...connectionIdProperty
      },
      required: ["container_id"]
    }
  },

  // 7. Get Document by ID
  {
    name: "mcp_get_document_by_id",
    description: `Get a single document by its ID and partition key. This is the most efficient way to retrieve a specific document.

IMPORTANT: Both document_id and partition_key are required for a point read in CosmosDB.
The partition_key type must match your container's partition key type.

Example: mcp_get_document_by_id({container_id: 'users', document_id: 'user-123', partition_key: 'user-123', connection_id: 'athlete'})`,
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID/name of the container"
        },
        document_id: {
          type: "string",
          description: "The unique ID of the document (the 'id' field value)"
        },
        partition_key: {
          type: ["string", "number", "boolean"],
          description: "The partition key value for the document. Must match the container's partition key path value."
        },
        ...connectionIdProperty
      },
      required: ["container_id", "document_id", "partition_key"]
    }
  },

  // 8. Schema Analysis
  {
    name: "mcp_analyze_schema",
    description: "Analyze the schema/structure of documents in a container. Samples documents to discover field names, data types, and frequency. Use this to understand the data model before writing queries.",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID/name of the container to analyze"
        },
        sample_size: {
          type: "number",
          description: "Number of documents to sample for analysis (default: 100)",
          default: 100
        },
        ...connectionIdProperty
      },
      required: ["container_id"]
    }
  },

  // 9. Create Document
  {
    name: "mcp_create_document",
    description: `Create a new document in a CosmosDB container.

REQUIREMENTS:
- The document MUST have an 'id' field (string)
- The document MUST have the partition key field with a value
- The 'id' must be unique within the partition

Example: mcp_create_document({
  container_id: 'users',
  document: {id: 'user-456', email: 'test@example.com', status: 'active'},
  partition_key: 'user-456',
  connection_id: 'athlete'
})`,
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID/name of the container"
        },
        document: {
          type: "object",
          description: "The document to create. Must include 'id' field and the partition key field."
        },
        partition_key: {
          type: ["string", "number", "boolean"],
          description: "The partition key value for the document"
        },
        ...connectionIdProperty
      },
      required: ["container_id", "document", "partition_key"]
    }
  },

  // 10. Update/Replace Document
  {
    name: "mcp_update_document",
    description: `Update (replace) an existing document in a CosmosDB container.

NOTE: This performs a full document replacement. Include ALL fields you want to keep.
For partial updates, first get the document with mcp_get_document_by_id, modify it, then update.

Example: mcp_update_document({
  container_id: 'users',
  document_id: 'user-456',
  document: {id: 'user-456', email: 'new@example.com', status: 'inactive'},
  partition_key: 'user-456',
  connection_id: 'athlete'
})`,
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID/name of the container"
        },
        document_id: {
          type: "string",
          description: "The ID of the document to update"
        },
        document: {
          type: "object",
          description: "The complete document with updated values. Must include 'id' field."
        },
        partition_key: {
          type: ["string", "number", "boolean"],
          description: "The partition key value for the document"
        },
        ...connectionIdProperty
      },
      required: ["container_id", "document_id", "document", "partition_key"]
    }
  },

  // 11. Delete Document
  {
    name: "mcp_delete_document",
    description: `Delete a document from a CosmosDB container.

WARNING: This operation is irreversible. The document will be permanently deleted.

Example: mcp_delete_document({
  container_id: 'users',
  document_id: 'user-456',
  partition_key: 'user-456',
  connection_id: 'athlete'
})`,
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID/name of the container"
        },
        document_id: {
          type: "string",
          description: "The ID of the document to delete"
        },
        partition_key: {
          type: ["string", "number", "boolean"],
          description: "The partition key value for the document"
        },
        ...connectionIdProperty
      },
      required: ["container_id", "document_id", "partition_key"]
    }
  },

  // 12. Upsert Document
  {
    name: "mcp_upsert_document",
    description: `Create or update a document in a CosmosDB container (upsert operation).

If a document with the same id and partition key exists, it will be replaced.
If it doesn't exist, a new document will be created.

Example: mcp_upsert_document({
  container_id: 'users',
  document: {id: 'user-456', email: 'test@example.com', lastUpdated: '2024-01-15'},
  partition_key: 'user-456',
  connection_id: 'athlete'
})`,
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID/name of the container"
        },
        document: {
          type: "object",
          description: "The document to create or update. Must include 'id' field and the partition key field."
        },
        partition_key: {
          type: ["string", "number", "boolean"],
          description: "The partition key value for the document"
        },
        ...connectionIdProperty
      },
      required: ["container_id", "document", "partition_key"]
    }
  }
];
