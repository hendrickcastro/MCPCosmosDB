import { getContainer } from '../db.js';
import { ToolResult, DocumentInfo, QueryStats, SchemaAnalysis, PropertyAnalysis } from './types.js';

// Helper function to write to stderr (MCP compliant - keeps stdout clean for JSON-RPC)
const log = (message: string): void => {
  process.stderr.write(`${message}\n`);
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
}): Promise<ToolResult<{ documents: any[]; stats: QueryStats }>> => {
  const { container_id, query, parameters, max_items = 100, enable_cross_partition = true } = args;
  log(`Executing mcp_execute_query with: ${JSON.stringify(args)}`);

  try {
    const container = getContainer(container_id);
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
 * Get documents from a container with optional filters
 */
export const mcp_get_documents = async (args: { 
  container_id: string; 
  limit?: number;
  partition_key?: string;
  filter_conditions?: Record<string, any>;
}): Promise<ToolResult<DocumentInfo[]>> => {
  const { container_id, limit = 100, partition_key, filter_conditions } = args;
  log(`Executing mcp_get_documents with: ${JSON.stringify(args)}`);

  try {
    const container = getContainer(container_id);

    // Build query
    let query = `SELECT * FROM c`;
    const parameters: Array<{ name: string; value: any }> = [];

    // Add filter conditions
    if (filter_conditions && Object.keys(filter_conditions).length > 0) {
      const whereClauses = Object.entries(filter_conditions).map(([key, value], index) => {
        const paramName = `@param${index}`;
        parameters.push({ name: paramName, value });
        return `c.${key} = ${paramName}`;
      });
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Add limit
    query = `SELECT TOP ${limit} * FROM (${query})`;

    const querySpec = { query, parameters };

    // Query options
    const options: any = { maxItemCount: limit };
    if (partition_key) {
      options.partitionKey = partition_key;
    }

    const { resources: documents } = await container.items.query(querySpec, options).fetchAll();

    return { success: true, data: documents };
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
  partition_key: string; 
}): Promise<ToolResult<DocumentInfo>> => {
  const { container_id, document_id, partition_key } = args;
  log(`Executing mcp_get_document_by_id with: ${JSON.stringify(args)}`);

  try {
    const container = getContainer(container_id);
    const { resource: document } = await container.item(document_id, partition_key).read();

    return { success: true, data: document };
  } catch (error: any) {
    log(`Error in mcp_get_document_by_id for document ${document_id}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Analyze document schema in a container
 */
export const mcp_analyze_schema = async (args: { 
  container_id: string; 
  sample_size?: number; 
}): Promise<ToolResult<SchemaAnalysis>> => {
  const { container_id, sample_size = 1000 } = args;
  log(`Executing mcp_analyze_schema with: ${JSON.stringify(args)}`);

  try {
    const container = getContainer(container_id);

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
