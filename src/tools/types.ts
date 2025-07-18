// Define a discriminated union for tool results for type safety
export type ToolSuccessResult<T> = { success: true; data: T; };
export type ToolErrorResult = { success: false; error: string; };
export type ToolResult<T> = ToolSuccessResult<T> | ToolErrorResult;

// CosmosDB specific types
export interface DatabaseInfo {
  id: string;
  throughput?: number;
  etag: string;
  timestamp: Date;
}

export interface ContainerInfo {
  id: string;
  partitionKey?: {
    paths: string[];
    kind?: string;
  };
  throughput?: number;
  indexingPolicy?: any;
  etag?: string;
  timestamp?: Date;
}

export interface DocumentInfo {
  id: string;
  [key: string]: any;
}

export interface QueryStats {
  requestCharge: number;
  executionTimeMs: number;
  documentCount: number;
  indexHitRatio?: number;
}

export interface ContainerStats {
  documentCount: number;
  sizeInKB: number;
  throughput?: number;
  partitionKeyStatistics?: PartitionKeyStats[];
}

export interface PartitionKeyStats {
  partitionKeyValue: string;
  documentCount: number;
  sizeInKB: number;
}

export interface SchemaAnalysis {
  sampleSize: number;
  commonProperties: PropertyAnalysis[];
  dataTypes: Record<string, number>;
  nestedStructures: NestedStructureAnalysis[];
}

export interface PropertyAnalysis {
  name: string;
  type: string;
  frequency: number;
  nullCount: number;
  examples: any[];
}

export interface NestedStructureAnalysis {
  path: string;
  type: 'object' | 'array';
  frequency: number;
  properties?: PropertyAnalysis[];
} 