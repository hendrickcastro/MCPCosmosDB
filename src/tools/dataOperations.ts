import { getContainer, validateModificationAllowed, getRegisteredConnectionsInfo, getConnectionInfo } from '../db.js';
import { 
  ToolResult, 
  DocumentInfo, 
  QueryStats, 
  SchemaAnalysis, 
  PropertyAnalysis,
  CreateDocumentArgs,
  UpdateDocumentArgs,
  DeleteDocumentArgs,
  UpsertDocumentArgs,
  DocumentOperationResult,
  DeleteOperationResult,
  PartitionKeyValue
} from './types.js';

// Helper function to write to stderr (MCP compliant - keeps stdout clean for JSON-RPC)
const log = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

/**
 * List all available connections
 */
export const mcp_list_connections = async (): Promise<ToolResult<{
  connections: Array<{id: string; databaseId: string; description?: string; isConnected: boolean}>;
  defaultConnection: string | null;
}>> => {
  log(`Executing mcp_list_connections`);
  
  try {
    const connections = getRegisteredConnectionsInfo();
    const defaultConn = connections.find(c => c.isConnected)?.id || connections[0]?.id || null;
    
    return { 
      success: true, 
      data: {
        connections,
        defaultConnection: defaultConn
      }
    };
  } catch (error: any) {
    log(`Error in mcp_list_connections: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Execute a SQL query against a CosmosDB container
 */
export const mcp_execute_query = async (args: { 
  container_id: string; 
  query: string; 
  parameters?: Record<string, any>;
  max_items?: number;
  enable_cross_partition?: boolean;
  connection_id?: string;
}): Promise<ToolResult<{ documents: any[]; stats: QueryStats }>> => {
  const { container_id, query, parameters, max_items = 100, enable_cross_partition = true, connection_id } = args;
  log(`Executing mcp_execute_query with: ${JSON.stringify({ ...args, query: query.substring(0, 100) })}`);

  try {
    const container = getContainer(container_id, connection_id);
    const startTime = Date.now();

    // Prepare query spec
    const querySpec = {
      query,
      parameters: parameters ? Object.entries(parameters).map(([name, value]) => ({ name: `@${name}`, value })) : []
    };

    // Execute query
    const queryIterator = container.items.query(querySpec, {
      maxItemCount: max_items
    });

    const { resources: documents, requestCharge } = await queryIterator.fetchAll();
    const executionTimeMs = Date.now() - startTime;

    const stats: QueryStats = {
      requestCharge,
      executionTimeMs,
      documentCount: documents.length
    };

    return { success: true, data: { documents, stats } };
  } catch (error: any) {
    log(`Error in mcp_execute_query for container ${container_id}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get documents from a container with optional filters and ordering
 */
export const mcp_get_documents = async (args: { 
  container_id: string; 
  limit?: number;
  partition_key?: PartitionKeyValue;
  filter_conditions?: Record<string, any>;
  order_by?: string;
  order_direction?: 'ASC' | 'DESC';
  connection_id?: string;
}): Promise<ToolResult<DocumentInfo[]>> => {
  const { container_id, limit = 100, partition_key, filter_conditions, order_by, order_direction = 'ASC', connection_id } = args;
  log(`Executing mcp_get_documents with: ${JSON.stringify(args)}`);

  try {
    const container = getContainer(container_id, connection_id);

    // Build query with proper TOP clause (not subquery)
    const whereClauses: string[] = [];
    const parameters: Array<{ name: string; value: any }> = [];

    // Add filter conditions
    if (filter_conditions && Object.keys(filter_conditions).length > 0) {
      Object.entries(filter_conditions).forEach(([key, value], index) => {
        const paramName = `@param${index}`;
        parameters.push({ name: paramName, value });
        whereClauses.push(`c.${key} = ${paramName}`);
      });
    }

    // Build final query
    let query = `SELECT * FROM c`;
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    // Add ORDER BY clause if specified
    if (order_by) {
      const direction = order_direction === 'DESC' ? 'DESC' : 'ASC';
      query += ` ORDER BY c.${order_by} ${direction}`;
    }

    const querySpec = { query, parameters };

    // Query options
    const options: any = { maxItemCount: limit };
    if (partition_key !== undefined) {
      options.partitionKey = partition_key;
    }

    const { resources: documents } = await container.items.query(querySpec, options).fetchAll();
    
    // Apply limit after query (since ORDER BY with TOP can be problematic in CosmosDB)
    const limitedDocuments = documents.slice(0, limit);

    return { success: true, data: limitedDocuments };
  } catch (error: any) {
    log(`Error in mcp_get_documents for container ${container_id}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get a specific document by ID and partition key
 */
export const mcp_get_document_by_id = async (args: { 
  container_id: string; 
  document_id: string; 
  partition_key: PartitionKeyValue;
  connection_id?: string;
}): Promise<ToolResult<DocumentInfo>> => {
  const { container_id, document_id, partition_key, connection_id } = args;
  log(`Executing mcp_get_document_by_id with: ${JSON.stringify(args)}`);

  try {
    const container = getContainer(container_id, connection_id);
    const { resource: document, statusCode } = await container.item(document_id, partition_key).read();

    if (!document) {
      return { success: false, error: `Document with id '${document_id}' not found` };
    }

    return { success: true, data: document };
  } catch (error: any) {
    log(`Error in mcp_get_document_by_id for document ${document_id}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Create a new document in a container
 */
export const mcp_create_document = async (args: CreateDocumentArgs & { connection_id?: string }): Promise<ToolResult<DocumentOperationResult>> => {
  const { container_id, document, partition_key, connection_id } = args;
  log(`Executing mcp_create_document with: ${JSON.stringify({ container_id, document_id: document.id, partition_key, connection_id })}`);

  try {
    // Validate modifications are allowed
    validateModificationAllowed('create_document', connection_id);
    
    // Validate document has an id
    if (!document.id) {
      return { success: false, error: "Document must have an 'id' field" };
    }

    const container = getContainer(container_id, connection_id);
    
    const { resource: createdDocument, requestCharge } = await container.items.create(
      document
    );

    if (!createdDocument) {
      return { success: false, error: "Failed to create document - no response from CosmosDB" };
    }

    return { 
      success: true, 
      data: {
        id: createdDocument.id,
        _etag: createdDocument._etag,
        _ts: createdDocument._ts,
        requestCharge: requestCharge || 0
      }
    };
  } catch (error: any) {
    log(`Error in mcp_create_document for container ${container_id}: ${error.message}`);
    
    // Provide more helpful error messages
    if (error.code === 409) {
      return { success: false, error: `Document with id '${document.id}' already exists in this partition` };
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Update (replace) an existing document in a container
 */
export const mcp_update_document = async (args: UpdateDocumentArgs & { connection_id?: string }): Promise<ToolResult<DocumentOperationResult>> => {
  const { container_id, document_id, document, partition_key, connection_id } = args;
  log(`Executing mcp_update_document with: ${JSON.stringify({ container_id, document_id, partition_key, connection_id })}`);

  try {
    // Validate modifications are allowed
    validateModificationAllowed('update_document', connection_id);
    
    // Ensure document has the correct id
    if (document.id && document.id !== document_id) {
      return { success: false, error: "Document 'id' field must match 'document_id' parameter" };
    }
    
    // Ensure id is set
    const documentToUpdate = { ...document, id: document_id };

    const container = getContainer(container_id, connection_id);
    
    const { resource: updatedDocument, requestCharge } = await container
      .item(document_id, partition_key)
      .replace(documentToUpdate);

    if (!updatedDocument) {
      return { success: false, error: "Failed to update document - no response from CosmosDB" };
    }

    return { 
      success: true, 
      data: {
        id: updatedDocument.id,
        _etag: updatedDocument._etag,
        _ts: updatedDocument._ts,
        requestCharge: requestCharge || 0
      }
    };
  } catch (error: any) {
    log(`Error in mcp_update_document for document ${document_id}: ${error.message}`);
    
    // Provide more helpful error messages
    if (error.code === 404) {
      return { success: false, error: `Document with id '${document_id}' not found` };
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Delete a document from a container
 */
export const mcp_delete_document = async (args: DeleteDocumentArgs & { connection_id?: string }): Promise<ToolResult<DeleteOperationResult>> => {
  const { container_id, document_id, partition_key, connection_id } = args;
  log(`Executing mcp_delete_document with: ${JSON.stringify(args)}`);

  try {
    // Validate modifications are allowed
    validateModificationAllowed('delete_document', connection_id);
    
    const container = getContainer(container_id, connection_id);
    
    const { requestCharge } = await container
      .item(document_id, partition_key)
      .delete();

    return { 
      success: true, 
      data: {
        deleted: true,
        id: document_id,
        requestCharge: requestCharge || 0
      }
    };
  } catch (error: any) {
    log(`Error in mcp_delete_document for document ${document_id}: ${error.message}`);
    
    // Provide more helpful error messages
    if (error.code === 404) {
      return { success: false, error: `Document with id '${document_id}' not found` };
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Create or update a document (upsert operation)
 */
export const mcp_upsert_document = async (args: UpsertDocumentArgs & { connection_id?: string }): Promise<ToolResult<DocumentOperationResult>> => {
  const { container_id, document, partition_key, connection_id } = args;
  log(`Executing mcp_upsert_document with: ${JSON.stringify({ container_id, document_id: document.id, partition_key, connection_id })}`);

  try {
    // Validate modifications are allowed
    validateModificationAllowed('upsert_document', connection_id);
    
    // Validate document has an id
    if (!document.id) {
      return { success: false, error: "Document must have an 'id' field" };
    }

    const container = getContainer(container_id, connection_id);
    
    const { resource: upsertedDocument, requestCharge } = await container.items.upsert(
      document
    );

    if (!upsertedDocument) {
      return { success: false, error: "Failed to upsert document - no response from CosmosDB" };
    }

    return { 
      success: true, 
      data: {
        id: upsertedDocument.id,
        _etag: upsertedDocument._etag,
        _ts: upsertedDocument._ts,
        requestCharge: requestCharge || 0
      }
    };
  } catch (error: any) {
    log(`Error in mcp_upsert_document for container ${container_id}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Analyze document schema in a container
 */
export const mcp_analyze_schema = async (args: { 
  container_id: string; 
  sample_size?: number;
  connection_id?: string;
}): Promise<ToolResult<SchemaAnalysis>> => {
  const { container_id, sample_size = 100, connection_id } = args;
  log(`Executing mcp_analyze_schema with: ${JSON.stringify(args)}`);

  try {
    const container = getContainer(container_id, connection_id);

    // Get sample documents
    const query = `SELECT TOP ${sample_size} * FROM c`;
    const { resources: documents } = await container.items.query(query).fetchAll();

    if (documents.length === 0) {
      return { success: true, data: { sampleSize: 0, commonProperties: [], dataTypes: {}, nestedStructures: [] } };
    }

    // Analyze properties
    const propertyStats: Record<string, { count: number; types: Set<string>; nullCount: number; examples: any[] }> = {};
    const dataTypeCounts: Record<string, number> = {};

    documents.forEach(doc => {
      analyzeObject(doc, '', propertyStats, dataTypeCounts);
    });

    // Convert to results
    const commonProperties: PropertyAnalysis[] = Object.entries(propertyStats)
      .map(([name, stats]) => ({
        name,
        type: Array.from(stats.types).join(' | '),
        frequency: stats.count / documents.length,
        nullCount: stats.nullCount,
        examples: stats.examples.slice(0, 5)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50); // Top 50 properties

    const schemaAnalysis: SchemaAnalysis = {
      sampleSize: documents.length,
      commonProperties,
      dataTypes: dataTypeCounts,
      nestedStructures: [] // Could be implemented for deeper analysis
    };

    return { success: true, data: schemaAnalysis };
  } catch (error: any) {
    log(`Error in mcp_analyze_schema for container ${container_id}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Helper function to analyze object properties recursively
function analyzeObject(obj: any, prefix: string, propertyStats: Record<string, any>, dataTypeCounts: Record<string, number>, maxDepth = 3): void {
  if (maxDepth <= 0 || obj === null || obj === undefined) return;

  Object.entries(obj).forEach(([key, value]) => {
    const propName = prefix ? `${prefix}.${key}` : key;
    const valueType = getValueType(value);

    // Update data type counts
    dataTypeCounts[valueType] = (dataTypeCounts[valueType] || 0) + 1;

    // Update property stats
    if (!propertyStats[propName]) {
      propertyStats[propName] = { count: 0, types: new Set(), nullCount: 0, examples: [] };
    }

    propertyStats[propName].count++;
    propertyStats[propName].types.add(valueType);

    if (value === null || value === undefined) {
      propertyStats[propName].nullCount++;
    } else if (propertyStats[propName].examples.length < 5) {
      propertyStats[propName].examples.push(value);
    }

    // Recurse for objects
    if (valueType === 'object' && value !== null) {
      analyzeObject(value, propName, propertyStats, dataTypeCounts, maxDepth - 1);
    }
  });
}

// Helper function to get value type
function getValueType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  return typeof value;
}
