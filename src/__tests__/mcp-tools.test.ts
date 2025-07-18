import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { connectCosmosDB } from '../db.js';

// Importar las herramientas directamente de los módulos específicos
import {
    mcp_list_databases,
    mcp_list_containers,
    mcp_container_info,
    mcp_container_stats
} from '../tools/containerAnalysis.js';

import {
    mcp_execute_query,
    mcp_get_documents,
    mcp_get_document_by_id,
    mcp_analyze_schema
} from '../tools/dataOperations.js';

describe('MCP CosmosDB Tools - Comprehensive Analysis', () => {
    beforeAll(async () => {
        try {
            console.log('🔌 Connecting to CosmosDB...');
            await connectCosmosDB();
            console.log('✅ CosmosDB connection established!');
        } catch (error) {
            console.warn('CosmosDB connection failed in tests:', error);
        }
    });

    afterAll(async () => {
        console.log('🔌 Closing CosmosDB connection...');
        // CosmosDB doesn't need explicit connection closing
    });

    describe('📊 Database Operations', () => {
        it('should list all databases', async () => {
            console.log('\n🔍 Getting databases...');

            const result = await mcp_list_databases();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(Array.isArray(result.data)).toBe(true);
                expect(result.data.length).toBeGreaterThan(0);

                console.log('✅ Databases found:', result.data.map((db: any) => db.id));
            }
        });
    });

    describe('📦 Container Operations', () => {
        it('should list all containers', async () => {
            console.log('\n🔍 Getting containers...');

            const result = await mcp_list_containers();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(Array.isArray(result.data)).toBe(true);
            }
        });

        it('should get container information', async () => {
            console.log('\n🔍 Getting container info...');

            const result = await mcp_container_info({ container_id: 'testcontainer' });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveProperty('id');
            }
        });

        it('should get container statistics', async () => {
            console.log('\n📊 Getting container stats...');

            const result = await mcp_container_stats({ 
                container_id: 'testcontainer',
                sample_size: 100 
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveProperty('documentCount');
            }
        });
    });

    describe('💻 Data Operations', () => {
        it('should execute query', async () => {
            console.log('\n💻 Executing query...');

            const result = await mcp_execute_query({
                container_id: 'testcontainer',
                query: 'SELECT * FROM c',
                max_items: 10
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(Array.isArray(result.data)).toBe(true);
            }
        });

        it('should get documents', async () => {
            console.log('\n📄 Getting documents...');

            const result = await mcp_get_documents({
                container_id: 'testcontainer',
                limit: 10
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(Array.isArray(result.data)).toBe(true);
            }
        });

        it('should get document by id', async () => {
            console.log('\n🎯 Getting document by ID...');

            const result = await mcp_get_document_by_id({
                container_id: 'testcontainer',
                document_id: 'doc1',
                partition_key: 'doc1'
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveProperty('id');
            }
        });

        it('should analyze schema', async () => {
            console.log('\n🔍 Analyzing schema...');

            const result = await mcp_analyze_schema({
                container_id: 'testcontainer',
                sample_size: 100
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveProperty('sampleSize');
                expect(result.data).toHaveProperty('commonProperties');
            }
        });
    });

    describe('🚨 Error Handling', () => {
        it('should handle errors gracefully', async () => {
            console.log('\n🚨 Testing error handling...');

            const result = await mcp_container_info({ container_id: 'nonexistent' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeDefined();
            }
        });
    });
}); 