import { 
  mcp_list_databases,
  mcp_list_containers,
  mcp_container_info,
  mcp_container_stats,
  mcp_execute_query,
  mcp_get_documents,
  mcp_get_document_by_id,
  mcp_analyze_schema
} from '../tools/index.js';

// Mock CosmosDB connection for testing
jest.mock('../db.js', () => ({
  getDatabase: jest.fn(() => ({
    client: {
      databases: {
        readAll: jest.fn(() => ({
          fetchAll: jest.fn().mockResolvedValue({
            resources: [
              { id: 'testdb', _etag: 'etag1', _ts: 1640995200 }
            ]
          })
        }))
      }
    },
    containers: {
      readAll: jest.fn(() => ({
        fetchAll: jest.fn().mockResolvedValue({
          resources: [
            { 
              id: 'testcontainer', 
              partitionKey: { paths: ['/id'], kind: 'Hash' },
              _etag: 'etag1', 
              _ts: 1640995200 
            }
          ]
        })
      }))
    }
  })),
  getContainer: jest.fn(() => ({
    read: jest.fn().mockResolvedValue({
      resource: {
        id: 'testcontainer',
        partitionKey: { paths: ['/id'], kind: 'Hash' },
        _etag: 'etag1',
        _ts: 1640995200
      }
    }),
    readOffer: jest.fn().mockResolvedValue({
      resource: { throughput: 400 }
    }),
    items: {
      query: jest.fn(() => ({
        fetchAll: jest.fn().mockResolvedValue({
          resources: [{ id: 'doc1', name: 'Test Document' }],
          requestCharge: 2.5
        })
      }))
    },
    item: jest.fn(() => ({
      read: jest.fn().mockResolvedValue({
        resource: { id: 'doc1', name: 'Test Document' }
      })
    }))
  }))
}));

describe('MCP CosmosDB Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Database Operations', () => {
    test('mcp_list_databases should return success with database list', async () => {
      const result = await mcp_list_databases();
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe('testdb');
      }
    });
  });

  describe('Container Operations', () => {
    test('mcp_list_containers should return success with container list', async () => {
      const result = await mcp_list_containers();
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe('testcontainer');
      }
    });

    test('mcp_container_info should return container details', async () => {
      const result = await mcp_container_info({ container_id: 'testcontainer' });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('testcontainer');
        expect(result.data.partitionKey?.paths).toEqual(['/id']);
      }
    });

    test('mcp_container_stats should return container statistics', async () => {
      const result = await mcp_container_stats({ 
        container_id: 'testcontainer',
        sample_size: 100
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('documentCount');
        expect(result.data).toHaveProperty('sizeInKB');
      }
    });
  });

  describe('Data Operations', () => {
    test('mcp_execute_query should execute query and return results', async () => {
      const result = await mcp_execute_query({
        container_id: 'testcontainer',
        query: 'SELECT * FROM c',
        max_items: 10
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.documents).toHaveLength(1);
        expect(result.data.stats.requestCharge).toBe(2.5);
      }
    });

    test('mcp_get_documents should return filtered documents', async () => {
      const result = await mcp_get_documents({
        container_id: 'testcontainer',
        limit: 10
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    test('mcp_get_document_by_id should return specific document', async () => {
      const result = await mcp_get_document_by_id({
        container_id: 'testcontainer',
        document_id: 'doc1',
        partition_key: 'doc1'
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('doc1');
      }
    });

    test('mcp_analyze_schema should return schema analysis', async () => {
      const result = await mcp_analyze_schema({
        container_id: 'testcontainer',
        sample_size: 100
      });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('sampleSize');
        expect(result.data).toHaveProperty('commonProperties');
        expect(result.data).toHaveProperty('dataTypes');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle errors gracefully', async () => {
      // Mock an error
      const mockGetContainer = require('../db.js').getContainer;
      mockGetContainer.mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      const result = await mcp_container_info({ container_id: 'nonexistent' });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Connection failed');
      }
    });
  });
}); 