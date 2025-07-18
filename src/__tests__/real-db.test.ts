/**
 * Tests específicos para la base de datos real de CosmosDB
 * Este archivo usa la configuración real del .env
 * NO debe ser incluido en .gitignore para pruebas específicas
 */

import { jest } from '@jest/globals';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test configuration
const TEST_CONFIG = {
  OCONNSTRING: process.env.OCONNSTRING,
  COSMOS_DATABASE_ID: process.env.COSMOS_DATABASE_ID || 'import'
};

import {
  mcp_list_databases, mcp_list_containers, mcp_container_info, mcp_container_stats,
  mcp_execute_query, mcp_get_documents, mcp_get_document_by_id, mcp_analyze_schema
} from '../tools/index.js';
import { connectCosmosDB } from '../db.js';

describe('Real CosmosDB Tests - dbsqlcosmosregistration', () => {
  beforeAll(async () => {
    // Conectar a la base de datos real antes de ejecutar los tests
    await connectCosmosDB();
  }, 30000); // 30 segundos timeout para conexión

  describe('Database Operations', () => {
    test('should list all databases in the account', async () => {
      const result = await mcp_list_databases();
      
      expect(result.success).toBe(true);
      if (result.success) {
        console.log('✅ Databases found:', result.data.map((db: any) => db.id));
        expect(result.data).toBeInstanceOf(Array);
        expect(result.data.length).toBeGreaterThan(0);
        
        // Verificar que existe la base de datos "import"
        const importDb = result.data.find((db: any) => db.id === 'import');
        expect(importDb).toBeDefined();
      }
    });

    test('should list containers in import database', async () => {
      const result = await mcp_list_containers();
      
      expect(result.success).toBe(true);
      if (result.success) {
        console.log('✅ Containers found:', result.data.map((c: any) => c.id));
        expect(result.data).toBeInstanceOf(Array);
        
        // Log información de cada container
        result.data.forEach((container: any) => {
          console.log(`Container: ${container.id}`, {
            partitionKey: container.partitionKey,
            indexingPolicy: container.indexingPolicy ? 'Defined' : 'Not defined'
          });
        });
      }
    });
  });

  describe('Container Analysis', () => {
    test('should analyze first available container', async () => {
      // Primero obtener la lista de containers
      const containersResult = await mcp_list_containers();
      expect(containersResult.success).toBe(true);
      
      if (containersResult.success && containersResult.data.length > 0) {
        const firstContainer = containersResult.data[0];
        console.log(`🔍 Analyzing container: ${firstContainer.id}`);
        
        // Obtener información detallada del container
        const infoResult = await mcp_container_info({ 
          container_id: firstContainer.id 
        });
        
        expect(infoResult.success).toBe(true);
        if (infoResult.success) {
          console.log('✅ Container info:', {
            id: infoResult.data.id,
            partitionKey: infoResult.data.partitionKey,
            throughputInfo: infoResult.data.throughputInfo ? 'Available' : 'Not available'
          });
        }

        // Obtener estadísticas del container
        const statsResult = await mcp_container_stats({ 
          container_id: firstContainer.id,
          sample_size: 100 
        });
        
        expect(statsResult.success).toBe(true);
        if (statsResult.success) {
          console.log('✅ Container stats:', {
            documentCount: statsResult.data.documentCount,
            sizeInKB: statsResult.data.sizeInKB,
            partitions: statsResult.data.partitionKeyStatistics?.length || 0
          });
        }
      } else {
        console.log('⚠️ No containers found in database');
      }
    });
  });

  describe('Data Operations', () => {
    test('should execute simple query on first container', async () => {
      // Obtener primer container disponible
      const containersResult = await mcp_list_containers();
      expect(containersResult.success).toBe(true);
      
      if (containersResult.success && containersResult.data.length > 0) {
        const firstContainer = containersResult.data[0];
        console.log(`🔍 Querying container: ${firstContainer.id}`);
        
        // Ejecutar query simple
        const queryResult = await mcp_execute_query({
          container_id: firstContainer.id,
          query: 'SELECT TOP 5 * FROM c',
          max_items: 5
        });
        
        expect(queryResult.success).toBe(true);
        if (queryResult.success) {
          console.log('✅ Query executed successfully:', {
            documentsReturned: queryResult.data.documents.length,
            requestCharge: queryResult.data.stats.requestCharge,
            executionTime: queryResult.data.stats.executionTimeMs
          });
          
          if (queryResult.data.documents.length > 0) {
            console.log('📄 Sample document keys:', Object.keys(queryResult.data.documents[0]));
          }
        }
      }
    });

    test('should get documents from first container', async () => {
      const containersResult = await mcp_list_containers();
      expect(containersResult.success).toBe(true);
      
      if (containersResult.success && containersResult.data.length > 0) {
        const firstContainer = containersResult.data[0];
        
        const documentsResult = await mcp_get_documents({
          container_id: firstContainer.id,
          limit: 3
        });
        
        expect(documentsResult.success).toBe(true);
        if (documentsResult.success) {
          console.log('✅ Documents retrieved:', documentsResult.data.length);
          
          if (documentsResult.data.length > 0) {
            console.log('📄 First document sample:', {
              id: documentsResult.data[0].id,
              keys: Object.keys(documentsResult.data[0])
            });
          }
        }
      }
    });

    test('should analyze schema of first container', async () => {
      const containersResult = await mcp_list_containers();
      expect(containersResult.success).toBe(true);
      
      if (containersResult.success && containersResult.data.length > 0) {
        const firstContainer = containersResult.data[0];
        
        const schemaResult = await mcp_analyze_schema({
          container_id: firstContainer.id,
          sample_size: 50
        });
        
        expect(schemaResult.success).toBe(true);
        if (schemaResult.success) {
          console.log('✅ Schema analysis completed:', {
            sampleSize: schemaResult.data.sampleSize,
            commonPropertiesCount: schemaResult.data.commonProperties.length,
            dataTypes: Object.keys(schemaResult.data.dataTypes)
          });
          
          // Mostrar las 5 propiedades más comunes
          const topProperties = schemaResult.data.commonProperties.slice(0, 5);
          console.log('🏷️ Top 5 properties:', topProperties.map((p: any) => ({
            name: p.name,
            type: p.type,
            frequency: `${(p.frequency * 100).toFixed(1)}%`
          })));
        }
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent container gracefully', async () => {
      const result = await mcp_container_info({ 
        container_id: 'non-existent-container-12345' 
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        console.log('✅ Error handled correctly:', result.error);
        expect(result.error).toBeTruthy();
      }
    });

    test('should handle invalid query gracefully', async () => {
      const containersResult = await mcp_list_containers();
      expect(containersResult.success).toBe(true);
      
      if (containersResult.success && containersResult.data.length > 0) {
        const firstContainer = containersResult.data[0];
        
        const result = await mcp_execute_query({
          container_id: firstContainer.id,
          query: 'SELECT * FROM invalid_syntax_query',
          max_items: 1
        });
        
        // Dependiendo de CosmosDB, esto podría fallar o retornar vacío
        console.log('🔍 Invalid query result:', result.success ? 'Success' : `Error: ${result.error}`);
      }
    });
  });
});

// Helper para mostrar resumen al final
afterAll(() => {
  console.log('\n📊 Test Summary for dbsqlcosmosregistration database completed');
  console.log('Database: import');
  console.log('Endpoint: dbsqlcosmosregistration.documents.azure.com');
}); 