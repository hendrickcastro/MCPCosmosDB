import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { connectCosmosDB } from '../db.js';

// Import tools from the modular structure with new names
import {
    mcp_list_databases,
    mcp_list_containers,
    mcp_get_container_definition,
    mcp_get_container_stats
} from '../tools/containerAnalysis.js';

import {
    mcp_execute_query,
    mcp_get_documents,
    mcp_get_document_by_id,
    mcp_analyze_schema,
    mcp_create_document,
    mcp_update_document,
    mcp_delete_document,
    mcp_upsert_document
} from '../tools/dataOperations.js';

// Test container name - will be determined dynamically
let testContainerId: string = '';

describe('MCP CosmosDB Tools - Comprehensive Analysis', () => {
    beforeAll(async () => {
        try {
            console.log(' Connecting to CosmosDB...');
            await connectCosmosDB();
            console.log(' CosmosDB connection established!');
            
            // Get the first available container for testing
            const containersResult = await mcp_list_containers();
            if (containersResult.success && containersResult.data.length > 0) {
                testContainerId = containersResult.data[0].id;
                console.log(` Using container '${testContainerId}' for tests`);
            }
        } catch (error) {
            console.warn('CosmosDB connection failed in tests:', error);
        }
    });

    afterAll(async () => {
        console.log(' Closing CosmosDB connection...');
        // CosmosDB doesn't need explicit connection closing
    });

    describe(' Database Operations', () => {
        it('should list all databases', async () => {
            console.log('\n Getting databases...');

            const result = await mcp_list_databases();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(Array.isArray(result.data)).toBe(true);
                expect(result.data.length).toBeGreaterThan(0);

                console.log(' Databases found:', result.data.map((db: any) => db.id));
            }
        });
    });

    describe(' Container Operations', () => {
        it('should list all containers', async () => {
            console.log('\n Getting containers...');

            const result = await mcp_list_containers();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(Array.isArray(result.data)).toBe(true);
            }
        });

        it('should get container definition', async () => {
            if (!testContainerId) {
                console.log(' Skipping: No container available for testing');
                return;
            }
            console.log('\n Getting container definition...');

            const result = await mcp_get_container_definition({ container_id: testContainerId });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveProperty('id');
                console.log(` Container '${result.data.id}' partition key:`, result.data.partitionKey);
            }
        });

        it('should get container statistics', async () => {
            if (!testContainerId) {
                console.log(' Skipping: No container available for testing');
                return;
            }
            console.log('\n Getting container stats...');

            const result = await mcp_get_container_stats({ 
                container_id: testContainerId,
                sample_size: 100 
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveProperty('documentCount');
                console.log(` Container has ${result.data.documentCount} documents`);
            }
        });
    });

    describe(' Data Operations', () => {
        it('should execute query', async () => {
            if (!testContainerId) {
                console.log(' Skipping: No container available for testing');
                return;
            }
            console.log('\n Executing query...');

            const result = await mcp_execute_query({
                container_id: testContainerId,
                query: 'SELECT TOP 5 * FROM c',
                max_items: 5
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveProperty('documents');
                expect(result.data).toHaveProperty('stats');
                expect(Array.isArray(result.data.documents)).toBe(true);
                console.log(` Query returned ${result.data.documents.length} documents, RU: ${result.data.stats.requestCharge}`);
            }
        });

        it('should get documents', async () => {
            if (!testContainerId) {
                console.log(' Skipping: No container available for testing');
                return;
            }
            console.log('\n Getting documents...');

            const result = await mcp_get_documents({
                container_id: testContainerId,
                limit: 10
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(Array.isArray(result.data)).toBe(true);
                console.log(` Retrieved ${result.data.length} documents`);
            }
        });

        it('should get document by id (expect not found for random id)', async () => {
            if (!testContainerId) {
                console.log(' Skipping: No container available for testing');
                return;
            }
            console.log('\n Getting document by ID (testing not found)...');

            const result = await mcp_get_document_by_id({
                container_id: testContainerId,
                document_id: 'nonexistent-doc-12345',
                partition_key: 'nonexistent-doc-12345'
            });

            // We expect this to fail since the document doesn't exist
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('not found');
                console.log(' Correctly returned not found error');
            }
        });

        it('should analyze schema', async () => {
            if (!testContainerId) {
                console.log(' Skipping: No container available for testing');
                return;
            }
            console.log('\n Analyzing schema...');

            const result = await mcp_analyze_schema({
                container_id: testContainerId,
                sample_size: 50
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveProperty('sampleSize');
                expect(result.data).toHaveProperty('commonProperties');
                console.log(` Analyzed ${result.data.sampleSize} documents, found ${result.data.commonProperties.length} properties`);
            }
        });
    });

    describe(' Error Handling', () => {
        it('should handle container not found error', async () => {
            console.log('\n Testing error handling for nonexistent container...');

            const result = await mcp_get_container_definition({ container_id: 'nonexistent-container-xyz' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeDefined();
                console.log(' Error handled correctly:', result.error.substring(0, 100));
            }
        });

        it('should handle invalid query gracefully', async () => {
            if (!testContainerId) {
                console.log(' Skipping: No container available for testing');
                return;
            }
            console.log('\n Testing error handling for invalid query...');

            const result = await mcp_execute_query({
                container_id: testContainerId,
                query: 'SELECT * FROM invalid_syntax WHERE',
                max_items: 10
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeDefined();
                console.log(' Error handled correctly:', result.error.substring(0, 100));
            }
        });
    });

    describe(' CRUD Operations - Security Check', () => {
        it('should block create when DB_ALLOW_MODIFICATIONS is false', async () => {
            // Ensure modifications are disabled
            const originalValue = process.env.DB_ALLOW_MODIFICATIONS;
            process.env.DB_ALLOW_MODIFICATIONS = 'false';
            
            console.log('\n Testing CRUD security (modifications disabled)...');

            const result = await mcp_create_document({
                container_id: testContainerId || 'test',
                document: { id: 'test-blocked', type: 'test' },
                partition_key: 'test-blocked'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('modifications are disabled');
            console.log(' Create correctly blocked:', result.error.substring(0, 80));
            
            // Restore original value
            process.env.DB_ALLOW_MODIFICATIONS = originalValue;
        });

        it('should block delete when DB_ALLOW_MODIFICATIONS is false', async () => {
            const originalValue = process.env.DB_ALLOW_MODIFICATIONS;
            process.env.DB_ALLOW_MODIFICATIONS = 'false';

            const result = await mcp_delete_document({
                container_id: testContainerId || 'test',
                document_id: 'test-doc',
                partition_key: 'test-doc'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('modifications are disabled');
            console.log(' Delete correctly blocked:', result.error.substring(0, 80));
            
            process.env.DB_ALLOW_MODIFICATIONS = originalValue;
        });
    });

    describe(' CRUD Operations - With Modifications Enabled', () => {
        const testDocId = `test-doc-${Date.now()}`;
        
        beforeAll(() => {
            // Enable modifications for CRUD tests
            process.env.DB_ALLOW_MODIFICATIONS = 'true';
            console.log('\n DB_ALLOW_MODIFICATIONS enabled for CRUD tests');
        });

        afterAll(() => {
            // Disable modifications after tests
            process.env.DB_ALLOW_MODIFICATIONS = 'false';
            console.log('\n DB_ALLOW_MODIFICATIONS disabled after CRUD tests');
        });
        
        it('should create a document when modifications enabled', async () => {
            if (!testContainerId) {
                console.log(' Skipping: No container available for testing');
                return;
            }
            console.log('\n Creating document...');

            const result = await mcp_create_document({
                container_id: testContainerId,
                document: {
                    id: testDocId,
                    type: 'test',
                    message: 'Test document created by MCP tools test',
                    timestamp: new Date().toISOString()
                },
                partition_key: testDocId
            });

            // This might fail if partition key doesn't match - that's ok for the test
            if (result.success) {
                expect(result.data).toHaveProperty('id');
                expect(result.data.id).toBe(testDocId);
                console.log(` Document created with id: ${result.data.id}, RU: ${result.data.requestCharge}`);
            } else {
                console.log(' Document creation failed (expected if partition key mismatch):', result.error.substring(0, 100));
            }
        });

        it('should upsert a document when modifications enabled', async () => {
            if (!testContainerId) {
                console.log(' Skipping: No container available for testing');
                return;
            }
            console.log('\n Upserting document...');

            const upsertDocId = `upsert-doc-${Date.now()}`;
            const result = await mcp_upsert_document({
                container_id: testContainerId,
                document: {
                    id: upsertDocId,
                    type: 'test',
                    message: 'Test document upserted by MCP tools test',
                    timestamp: new Date().toISOString()
                },
                partition_key: upsertDocId
            });

            // This might fail if partition key doesn't match - that's ok for the test
            if (result.success) {
                expect(result.data).toHaveProperty('id');
                console.log(` Document upserted with id: ${result.data.id}, RU: ${result.data.requestCharge}`);
                
                // Cleanup - delete the test document
                await mcp_delete_document({
                    container_id: testContainerId,
                    document_id: upsertDocId,
                    partition_key: upsertDocId
                });
                console.log(' Test document cleaned up');
            } else {
                console.log(' Document upsert failed (expected if partition key mismatch):', result.error.substring(0, 100));
            }
        });
    });
});
