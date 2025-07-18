/**
 * Utility functions for CosmosDB MCP server
 */

/**
 * Normalize container ID to ensure it's properly formatted
 */
export const normalizeContainerId = (containerId: string): string => {
  return containerId.trim().toLowerCase();
};

/**
 * Parse partition key value from a document based on partition key path
 */
export const extractPartitionKey = (document: any, partitionKeyPath: string): any => {
  // Remove leading '/' from path
  const cleanPath = partitionKeyPath.startsWith('/') ? partitionKeyPath.substring(1) : partitionKeyPath;
  
  // Split path and traverse object
  const pathParts = cleanPath.split('/');
  let value = document;
  
  for (const part of pathParts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }
  
  return value;
};

/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate CosmosDB container ID format
 */
export const isValidContainerId = (containerId: string): boolean => {
  // CosmosDB container IDs must be between 1-255 characters
  // Can contain letters, numbers, and hyphens
  // Cannot start or end with hyphen
  const regex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  return containerId.length >= 1 && containerId.length <= 255 && regex.test(containerId);
};

/**
 * Safely stringify an object for logging
 */
export const safeStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (value === undefined) return '[undefined]';
      if (typeof value === 'function') return '[function]';
      if (value instanceof Date) return value.toISOString();
      return value;
    }, 2);
  } catch (error) {
    return `[Stringify Error: ${error}]`;
  }
}; 