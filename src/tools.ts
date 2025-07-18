export const MCP_COSMOSDB_TOOLS = [
  // 1. Database Operations
  {
    name: "mcp_list_databases",
    description: "List all databases in the CosmosDB account",
    inputSchema: {
      type: "object",
      properties: {
        random_string: {
          type: "string",
          description: "Dummy parameter for no-parameter tools"
        }
      },
      required: ["random_string"]
    }
  },

  // 2. Container Operations
  {
    name: "mcp_list_containers",
    description: "List all containers in the CosmosDB database",
    inputSchema: {
      type: "object",
      properties: {
        random_string: {
          type: "string",
          description: "Dummy parameter for no-parameter tools"
        }
      },
      required: ["random_string"]
    }
  },

  // 3. Container Information
  {
    name: "mcp_container_info",
    description: "Get detailed information about a specific container including throughput settings",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID of the container to analyze"
        }
      },
      required: ["container_id"]
    }
  },

  // 4. Container Statistics
  {
    name: "mcp_container_stats",
    description: "Get statistical information about a container including document count and partition key distribution",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID of the container to analyze"
        },
        sample_size: {
          type: "number",
          description: "Sample size for statistics calculation",
          default: 1000
        }
      },
      required: ["container_id"]
    }
  },

  // 5. Query Execution
  {
    name: "mcp_execute_query",
    description: "Execute a SQL query against a CosmosDB container",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID of the container to query"
        },
        query: {
          type: "string",
          description: "The SQL query to execute"
        },
        parameters: {
          type: "object",
          description: "Optional parameters for the query as key-value pairs"
        },
        max_items: {
          type: "number",
          description: "Maximum number of items to return",
          default: 100
        },
        enable_cross_partition: {
          type: "boolean",
          description: "Whether to enable cross-partition queries",
          default: true
        }
      },
      required: ["container_id", "query"]
    }
  },

  // 6. Document Operations
  {
    name: "mcp_get_documents",
    description: "Get documents from a container with optional filters",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID of the container to query"
        },
        limit: {
          type: "number",
          description: "Maximum number of documents to return",
          default: 100
        },
        partition_key: {
          type: "string",
          description: "Optional partition key to filter by"
        },
        filter_conditions: {
          type: "object",
          description: "Optional filter conditions as key-value pairs"
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
          description: "The ID of the container"
        },
        document_id: {
          type: "string",
          description: "The ID of the document to retrieve"
        },
        partition_key: {
          type: "string",
          description: "The partition key value for the document"
        }
      },
      required: ["container_id", "document_id", "partition_key"]
    }
  },

  // 8. Schema Analysis
  {
    name: "mcp_analyze_schema",
    description: "Analyze the schema of documents in a container to understand data structure and types",
    inputSchema: {
      type: "object",
      properties: {
        container_id: {
          type: "string",
          description: "The ID of the container to analyze"
        },
        sample_size: {
          type: "number",
          description: "Number of documents to sample for analysis",
          default: 100
        }
      },
      required: ["container_id"]
    }
  }
]; 