import { CosmosClient, Database, Container } from '@azure/cosmos';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// ============================================================================
// MULTI-CONNECTION SYSTEM
// ============================================================================

/**
 * Connection configuration interface
 */
export interface ConnectionConfig {
  id: string;
  connectionString: string;
  databaseId: string;
  allowModifications?: boolean;
  description?: string;
}

/**
 * Active connection with client and database
 */
interface ActiveConnection {
  config: ConnectionConfig;
  client: CosmosClient;
  database: Database;
}

// Store all registered connections
const registeredConnections = new Map<string, ConnectionConfig>();

// Store active (connected) connections
const activeConnections = new Map<string, ActiveConnection>();

// Default connection ID (for backwards compatibility)
let defaultConnectionId: string | null = null;

// Helper function to write to stderr (MCP compliant)
const log = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

// Helper function to parse boolean values
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return ['true', 'yes', '1', 'on'].includes(value.toLowerCase());
};

// ============================================================================
// CONNECTION REGISTRATION
// ============================================================================

/**
 * Register a new connection configuration.
 * The first registered connection becomes the default.
 */
export const registerConnection = (config: ConnectionConfig): void => {
  if (!config.id) {
    throw new Error('Connection ID is required');
  }
  if (!config.connectionString) {
    throw new Error(`Connection string is required for connection '${config.id}'`);
  }
  if (!config.databaseId) {
    throw new Error(`Database ID is required for connection '${config.id}'`);
  }

  registeredConnections.set(config.id, config);
  log(`[REGISTER] Connection '${config.id}' registered (database: ${config.databaseId})`);

  // First connection becomes default
  if (!defaultConnectionId) {
    defaultConnectionId = config.id;
    log(`[REGISTER] '${config.id}' set as default connection`);
  }
};

/**
 * Load connections from multiple sources (in priority order):
 * 1. COSMOS_CONNECTIONS_FILE - Path to a JSON file with connections array
 * 2. COSMOS_CONNECTIONS - JSON string with connections array  
 * 3. COSMOS_CONNECTION_STRING + COSMOS_DATABASE_ID - Single connection (legacy)
 * 
 * File format (cosmos-connections.json):
 * [
 *   {"id": "athlete", "connectionString": "AccountEndpoint=...;AccountKey=...;", "databaseId": "data"},
 *   {"id": "events", "connectionString": "AccountEndpoint=...;AccountKey=...;", "databaseId": "events"}
 * ]
 */
export const loadConnectionsFromEnv = (): void => {
  // Priority 1: Load from file
  const connectionsFile = process.env.COSMOS_CONNECTIONS_FILE;
  if (connectionsFile) {
    try {
      const filePath = path.resolve(connectionsFile);
      log(`[LOAD] Reading connections from file: ${filePath}`);
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const connections: ConnectionConfig[] = JSON.parse(fileContent);
        
        for (const conn of connections) {
          registerConnection(conn);
        }
        log(`[LOAD] Loaded ${connections.length} connections from file`);
        return;
      } else {
        log(`[LOAD] Warning: Connections file not found: ${filePath}`);
      }
    } catch (error: any) {
      log(`[LOAD] Error reading connections file: ${error.message}`);
      throw new Error(`Error reading COSMOS_CONNECTIONS_FILE: ${error.message}`);
    }
  }

  // Priority 2: Load from JSON env var
  const connectionsJson = process.env.COSMOS_CONNECTIONS;
  if (connectionsJson) {
    try {
      const connections: ConnectionConfig[] = JSON.parse(connectionsJson);
      for (const conn of connections) {
        registerConnection(conn);
      }
      log(`[LOAD] Loaded ${connections.length} connections from COSMOS_CONNECTIONS env`);
      return;
    } catch (error: any) {
      log(`[LOAD] Error parsing COSMOS_CONNECTIONS: ${error.message}`);
      throw new Error(`Invalid COSMOS_CONNECTIONS format: ${error.message}`);
    }
  }
  
  // Priority 3: Fallback to single connection from legacy env vars
  const legacyConnString = process.env.COSMOS_CONNECTION_STRING || process.env.OCONNSTRING;
  const legacyDbId = process.env.COSMOS_DATABASE_ID;
  
  if (legacyConnString) {
    registerConnection({
      id: 'default',
      connectionString: legacyConnString,
      databaseId: legacyDbId || 'defaultdb',
      allowModifications: parseBoolean(process.env.DB_ALLOW_MODIFICATIONS, false),
      description: 'Default connection (from environment variables)'
    });
    log(`[LOAD] Loaded single connection from legacy env vars`);
  }
};

/**
 * Get list of all registered connection IDs
 */
export const getRegisteredConnectionIds = (): string[] => {
  return Array.from(registeredConnections.keys());
};

/**
 * Get all registered connections info (without sensitive data)
 */
export const getRegisteredConnectionsInfo = (): Array<{id: string; databaseId: string; description?: string; isConnected: boolean}> => {
  return Array.from(registeredConnections.values()).map(conn => ({
    id: conn.id,
    databaseId: conn.databaseId,
    description: conn.description,
    isConnected: activeConnections.has(conn.id)
  }));
};

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Parse connection string to extract endpoint and key
 */
const parseConnectionString = (connectionString: string): { endpoint: string; key: string } => {
  const endpointMatch = connectionString.match(/AccountEndpoint=([^;]+)/);
  const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
  
  if (!endpointMatch || !keyMatch) {
    throw new Error('Invalid connection string format. Expected AccountEndpoint and AccountKey');
  }
  
  return {
    endpoint: endpointMatch[1],
    key: keyMatch[1]
  };
};

/**
 * Connect to a specific CosmosDB instance by connection ID
 */
export const connectById = async (connectionId: string): Promise<void> => {
  const config = registeredConnections.get(connectionId);
  if (!config) {
    const available = getRegisteredConnectionIds().join(', ') || 'none';
    throw new Error(`Connection '${connectionId}' not found. Available: ${available}`);
  }

  // Already connected?
  if (activeConnections.has(connectionId)) {
    log(`[CONNECT] '${connectionId}' already connected`);
    return;
  }

  try {
    const { endpoint, key } = parseConnectionString(config.connectionString);
    
    log(`[CONNECT] Connecting '${connectionId}' to ${endpoint} / ${config.databaseId}`);
    
    const client = new CosmosClient({
      endpoint,
      key,
      userAgentSuffix: `MCP-CosmosDB-${connectionId}`
    });

    const database = client.database(config.databaseId);
    
    // Test connection
    await database.read();
    
    activeConnections.set(connectionId, { config, client, database });
    log(`[CONNECT] '${connectionId}' connected successfully`);
  } catch (error: any) {
    log(`[CONNECT] Error connecting '${connectionId}': ${error.message}`);
    throw error;
  }
};

/**
 * Connect all registered connections
 */
export const connectAll = async (): Promise<void> => {
  const ids = getRegisteredConnectionIds();
  log(`[CONNECT] Connecting ${ids.length} registered connections...`);
  
  for (const id of ids) {
    try {
      await connectById(id);
    } catch (error: any) {
      log(`[CONNECT] Failed to connect '${id}': ${error.message}`);
      // Continue with other connections
    }
  }
};

/**
 * Legacy function - connects the default connection
 */
export const connectCosmosDB = async (): Promise<void> => {
  if (registeredConnections.size === 0) {
    loadConnectionsFromEnv();
  }
  
  if (defaultConnectionId) {
    await connectById(defaultConnectionId);
  } else {
    throw new Error('No connections registered');
  }
};

// ============================================================================
// CONNECTION ACCESS
// ============================================================================

/**
 * Resolve connection ID - returns the provided ID or the default
 */
const resolveConnectionId = (connectionId?: string): string => {
  if (connectionId) {
    return connectionId;
  }
  if (defaultConnectionId) {
    return defaultConnectionId;
  }
  throw new Error('No connection ID provided and no default connection set');
};

/**
 * Get an active connection by ID
 */
const getConnection = (connectionId?: string): ActiveConnection => {
  const id = resolveConnectionId(connectionId);
  const connection = activeConnections.get(id);
  
  if (!connection) {
    const available = Array.from(activeConnections.keys()).join(', ') || 'none';
    throw new Error(`Connection '${id}' not active. Active connections: ${available}`);
  }
  
  return connection;
};

/**
 * Get CosmosDB client for a specific connection
 */
export const getCosmosClient = (connectionId?: string): CosmosClient => {
  return getConnection(connectionId).client;
};

/**
 * Get database reference for a specific connection
 */
export const getDatabase = (connectionId?: string): Database => {
  return getConnection(connectionId).database;
};

/**
 * Get container reference for a specific connection
 */
export const getContainer = (containerId: string, connectionId?: string): Container => {
  const db = getDatabase(connectionId);
  return db.container(containerId);
};

/**
 * Get connection info for debugging
 */
export const getConnectionInfo = (connectionId?: string): { 
  connectionId: string;
  endpoint: string; 
  databaseId: string; 
  allowModifications: boolean;
  pid: number;
  activeConnections: string[];
  registeredConnections: string[];
} => {
  const id = resolveConnectionId(connectionId);
  const connection = activeConnections.get(id);
  const config = registeredConnections.get(id);
  
  const { endpoint } = config ? parseConnectionString(config.connectionString) : { endpoint: 'NOT CONNECTED' };
  
  return {
    connectionId: id,
    endpoint,
    databaseId: config?.databaseId || 'NOT SET',
    allowModifications: config?.allowModifications || false,
    pid: process.pid,
    activeConnections: Array.from(activeConnections.keys()),
    registeredConnections: Array.from(registeredConnections.keys())
  };
};

// ============================================================================
// MODIFICATION CONTROL
// ============================================================================

/**
 * Check if modifications are allowed for a specific connection
 */
export const isModificationAllowed = (connectionId?: string): boolean => {
  const id = resolveConnectionId(connectionId);
  const config = registeredConnections.get(id);
  
  // Check connection-specific setting first
  if (config?.allowModifications !== undefined) {
    return config.allowModifications;
  }
  
  // Fall back to global env var
  return parseBoolean(process.env.DB_ALLOW_MODIFICATIONS, false);
};

/**
 * Validate that modifications are allowed before performing write operations
 */
export const validateModificationAllowed = (operation: string, connectionId?: string): void => {
  const id = resolveConnectionId(connectionId);
  
  if (!isModificationAllowed(connectionId)) {
    throw new Error(
      `Database modifications are disabled for connection '${id}'. ` +
      `Operation '${operation}' was blocked. ` +
      `Set allowModifications=true in the connection config to enable write operations.`
    );
  }
};

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Close a specific connection
 */
export const closeConnectionById = async (connectionId: string): Promise<void> => {
  const connection = activeConnections.get(connectionId);
  if (connection) {
    try {
      await connection.client.dispose();
      activeConnections.delete(connectionId);
      log(`[CLOSE] Connection '${connectionId}' closed`);
    } catch (e) {
      log(`[CLOSE] Warning closing '${connectionId}': ${e}`);
    }
  }
};

/**
 * Close all connections
 */
export const closeConnection = async (): Promise<void> => {
  for (const id of activeConnections.keys()) {
    await closeConnectionById(id);
  }
  log('[CLOSE] All connections closed');
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

