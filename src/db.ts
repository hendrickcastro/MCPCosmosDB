import { CosmosClient, Database, Container } from '@azure/cosmos';
import dotenv from 'dotenv';

dotenv.config();

let cosmosClient: CosmosClient | null = null;
let database: Database | null = null;

// Helper function to parse boolean values
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return ['true', 'yes', '1', 'on'].includes(value.toLowerCase());
};

// Build CosmosDB configuration
const buildConfig = () => {
  const connectionString = process.env.OCONNSTRING;
  
  if (!connectionString) {
    throw new Error('OCONNSTRING environment variable is required');
  }

  // Parse connection string to extract endpoint and key
  const endpointMatch = connectionString.match(/AccountEndpoint=([^;]+)/);
  const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
  
  if (!endpointMatch || !keyMatch) {
    throw new Error('Invalid connection string format. Expected AccountEndpoint and AccountKey');
  }

  const endpoint = endpointMatch[1];
  const key = keyMatch[1];

  return {
    endpoint,
    key,
    options: {
      enableEndpointDiscovery: parseBoolean(process.env.COSMOS_ENABLE_ENDPOINT_DISCOVERY, true),
      maxRetryAttemptCount: Number(process.env.COSMOS_MAX_RETRY_ATTEMPTS) || 9,
      maxRetryWaitTimeInMs: Number(process.env.COSMOS_MAX_RETRY_WAIT_TIME) || 30000,
      enableCrossPartitionQuery: parseBoolean(process.env.COSMOS_ENABLE_CROSS_PARTITION_QUERY, true),
      userAgentSuffix: 'MCP-CosmosDB-Server'
    }
  };
};

// Connect to CosmosDB
export const connectCosmosDB = async (): Promise<void> => {
  try {
    if (cosmosClient) {
      console.error('CosmosDB client already connected');
      return;
    }

    const config = buildConfig();
    
    // Create CosmosClient
    cosmosClient = new CosmosClient({
      endpoint: config.endpoint,
      key: config.key,
      ...config.options
    });

    // Get database reference
    const databaseId = process.env.COSMOS_DATABASE_ID || 'defaultdb';
    database = cosmosClient.database(databaseId);

    // Test connection by reading database info
    await database.read();
    
    console.error(`Successfully connected to CosmosDB database: ${databaseId}`);
  } catch (error: any) {
    console.error('Error connecting to CosmosDB:', error.message);
    throw error;
  }
};

// Get CosmosDB client
export const getCosmosClient = (): CosmosClient => {
  if (!cosmosClient) {
    throw new Error('CosmosDB client not initialized. Call connectCosmosDB first.');
  }
  return cosmosClient;
};

// Get database reference
export const getDatabase = (): Database => {
  if (!database) {
    throw new Error('CosmosDB database not initialized. Call connectCosmosDB first.');
  }
  return database;
};

// Get container reference
export const getContainer = (containerId: string): Container => {
  const db = getDatabase();
  return db.container(containerId);
};

// Close connection
export const closeConnection = async (): Promise<void> => {
  if (cosmosClient) {
    await cosmosClient.dispose();
    cosmosClient = null;
    database = null;
    console.error('CosmosDB connection closed');
  }
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