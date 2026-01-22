import { getDatabase, getContainer } from '../db.js';
import { ToolResult, ContainerInfo, ContainerStats, DatabaseInfo } from './types.js';

// Helper function to write to stderr (MCP compliant - keeps stdout clean for JSON-RPC)
const log = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

/**
 * List all databases in the CosmosDB account
 */
export const mcp_list_databases = async (): Promise<ToolResult<DatabaseInfo[]>> => {
  log('Executing mcp_list_databases');

  try {
    const database = getDatabase();
    const client = database.client;
    
    const { resources: databases } = await client.databases.readAll().fetchAll();
    
    const databasesInfo: DatabaseInfo[] = databases.map(db => ({
      id: db.id,
      etag: db._etag,
      timestamp: new Date(db._ts * 1000)
    }));

    return { success: true, data: databasesInfo };
  } catch (error: any) {
    log(`Error in mcp_list_databases: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * List all containers in the database
 */
export const mcp_list_containers = async (): Promise<ToolResult<ContainerInfo[]>> => {
  log('Executing mcp_list_containers');

  try {
    const database = getDatabase();
    const { resources: containers } = await database.containers.readAll().fetchAll();
    
    const containersInfo: ContainerInfo[] = containers.map((container: any) => ({
      id: container.id,
      partitionKey: container.partitionKey ? {
        paths: container.partitionKey.paths || [],
        kind: container.partitionKey.kind
      } : undefined,
      indexingPolicy: container.indexingPolicy,
      etag: container._etag,
      timestamp: container._ts ? new Date(container._ts * 1000) : undefined
    }));

    return { success: true, data: containersInfo };
  } catch (error: any) {
    log(`Error in mcp_list_containers: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get detailed information about a specific container
 */
export const mcp_container_info = async (args: { container_id: string }): Promise<ToolResult<ContainerInfo & { throughputInfo?: any }>> => {
  const { container_id } = args;
  log(`Executing mcp_container_info with: ${JSON.stringify(args)}`);

  try {
    const container = getContainer(container_id);
    
    // Read container definition
    const { resource: containerDef } = await container.read();
    
    // Try to read throughput settings
    let throughputInfo;
    try {
      const offerResponse = await container.readOffer();
      throughputInfo = offerResponse.resource;
    } catch (offerError) {
      // Throughput might not be defined for shared throughput containers
      log('Could not read container throughput (might use shared database throughput)');
    }

    if (!containerDef) {
      throw new Error(`Container ${container_id} not found`);
    }

    const containerInfo: ContainerInfo & { throughputInfo?: any } = {
      id: containerDef.id,
      partitionKey: containerDef.partitionKey ? {
        paths: containerDef.partitionKey.paths || [],
        kind: containerDef.partitionKey.kind
      } : undefined,
      indexingPolicy: containerDef.indexingPolicy,
      etag: containerDef._etag,
      timestamp: containerDef._ts ? new Date(containerDef._ts * 1000) : undefined,
      throughputInfo
    };

    return { success: true, data: containerInfo };
  } catch (error: any) {
    log(`Error in mcp_container_info for container ${container_id}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get basic statistics about a container
 */
export const mcp_container_stats = async (args: { container_id: string; sample_size?: number }): Promise<ToolResult<ContainerStats>> => {
  const { container_id, sample_size = 1000 } = args;
  log(`Executing mcp_container_stats with: ${JSON.stringify(args)}`);

  try {
    const container = getContainer(container_id);
    
    // Query to count total documents
    const countQuery = 'SELECT VALUE COUNT(1) FROM c';
    const { resources: countResult } = await container.items.query(countQuery).fetchAll();
    const documentCount = countResult[0] || 0;

    // Get partition key path for statistics
    const { resource: containerDef } = await container.read();
    if (!containerDef || !containerDef.partitionKey || !containerDef.partitionKey.paths || containerDef.partitionKey.paths.length === 0) {
      throw new Error(`Container ${container_id} does not have a valid partition key defined`);
    }
    const partitionKeyPath = containerDef.partitionKey.paths[0];

    // Sample documents to estimate size and analyze partitions
    const sampleQuery = `SELECT TOP ${sample_size} * FROM c`;
    const { resources: sampleDocs } = await container.items.query(sampleQuery).fetchAll();

    // Calculate estimated size based on sample
    let totalSampleSize = 0;
    const partitionStats: Record<string, { count: number; size: number }> = {};

    sampleDocs.forEach(doc => {
      const docSize = JSON.stringify(doc).length;
      totalSampleSize += docSize;

      // Get partition key value
      const partitionValue = getNestedProperty(doc, partitionKeyPath.substring(1)); // Remove leading '/'
      const partitionKey = String(partitionValue || 'undefined');

      if (!partitionStats[partitionKey]) {
        partitionStats[partitionKey] = { count: 0, size: 0 };
      }
      partitionStats[partitionKey].count++;
      partitionStats[partitionKey].size += docSize;
    });

    // Estimate total size
    const avgDocSize = sampleDocs.length > 0 ? totalSampleSize / sampleDocs.length : 0;
    const estimatedSizeInKB = Math.round((documentCount * avgDocSize) / 1024);

    // Convert partition stats
    const partitionKeyStatistics = Object.entries(partitionStats).map(([key, stats]) => ({
      partitionKeyValue: key,
      documentCount: Math.round((stats.count / sampleDocs.length) * documentCount),
      sizeInKB: Math.round(stats.size / 1024)
    }));

    const containerStats: ContainerStats = {
      documentCount,
      sizeInKB: estimatedSizeInKB,
      partitionKeyStatistics
    };

    return { success: true, data: containerStats };
  } catch (error: any) {
    log(`Error in mcp_container_stats for container ${container_id}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Helper function to get nested property from object
function getNestedProperty(obj: any, path: string): any {
  return path.split('/').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}
