export const MCP_COSMOSDB_TOOLS = [
  // 1. Database Listing
  {
    name: "mcp_list_databases",
    description: "List all databases in the CosmosDB account",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },

  // 2. Container Listing
  {
    name: "mcp_list_containers",
    description: "List all containers in the current CosmosDB database",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },

  // 3. Container Information
  {
    name: "mcp_container_info",
    description: "Get detailed information about a specific CosmosDB container including partition key, indexing policy, and throughput",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "ID of the container to analyze, e.g. \"users\" or \"products\""
        }
      },
      required: ["container_id"]
    }
  },

  // 4. Container Statistics
  {
    name: "mcp_container_stats",
    description: "Get statistics about a CosmosDB container including document count, size estimation, and partition key distribution",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "ID of the container to analyze"
        },
        sample_size: {
          type: "number",
          description: "Number of documents to sample for statistics (default: 1000)",
          default: 1000
        }
      },
      required: ["container_id"]
    }
  },

  // 5. Execute SQL Query
  {
    name: "mcp_execute_query",
    description: "Execute a SQL query against a CosmosDB container with optional parameters",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "ID of the container to query"
        },
        query: {
          type: "string",
          description: "SQL query to execute, e.g. \"SELECT * FROM c WHERE c.status = @status\""
        },
        parameters: {
          type: "object",
          description: "Query parameters as key-value pairs, e.g. {\"status\": \"active\"}"
        },
        max_items: {
          type: "number",
          description: "Maximum number of items to return (default: 100)",
          default: 100
        },
        enable_cross_partition: {
          type: "boolean",
          description: "Enable cross-partition queries (default: true)",
          default: true
        }
      },
      required: ["container_id", "query"]
    }
  },

  // 6. Get Documents
  {
    name: "mcp_get_documents",
    description: "Get documents from a CosmosDB container with optional filtering",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "ID of the container to query"
        },
        limit: {
          type: "number",
          description: "Maximum number of documents to return (default: 100)",
          default: 100
        },
        partition_key: {
          type: "string",
          description: "Specific partition key value to query (optional)"
        },
        filter_conditions: {
          type: "object",
          description: "Filter conditions as key-value pairs, e.g. {\"status\": \"active\", \"category\": \"electronics\"}"
        }
      },
      required: ["container_id"]
    }
  },

  // 7. Get Document by ID
  {
    name: "mcp_get_document_by_id",
    description: "Get a specific document by its ID and partition key",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "ID of the container containing the document"
        },
        document_id: {
          type: "string",
          description: "ID of the document to retrieve"
        },
        partition_key: {
          type: "string",
          description: "Partition key value for the document"
        }
      },
      required: ["container_id", "document_id", "partition_key"]
    }
  },

  // 8. Schema Analysis
  {
    name: "mcp_analyze_schema",
    description: "Analyze the schema structure of documents in a CosmosDB container",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "ID of the container to analyze"
        },
        sample_size: {
          type: "number",
          description: "Number of documents to sample for analysis (default: 1000)",
          default: 1000
        }
      },
      required: ["container_id"]
    }
  }
]; 