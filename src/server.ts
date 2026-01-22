#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { loadConnectionsFromEnv, connectAll, getRegisteredConnectionIds } from './db.js';
import { MCP_COSMOSDB_TOOLS } from './tools.js';
import * as toolHandlers from './mcp-server.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = "2.0.0"; // Multi-connection version

// Helper function to write to stderr (MCP compliant - keeps stdout clean for JSON-RPC)
const log = (message: string): void => {
    process.stderr.write(`${message}\n`);
};

// Setup file logging
function logToFile(message: string, ...args: any[]) {
    const logFile = path.join(__dirname, '..', 'mcp_debug.log');
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message} ${args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' ')}\n`;

    try {
        fs.appendFileSync(logFile, logMessage);
        log(`${message} ${args.join(' ')}`); // Also log to stderr
    } catch (err) {
        log(`Error writing to log file: ${err}`);
    }
}

// Function to safely prepare data for MCP response
function prepareDataForResponse(data: any): string {
    try {
        let serialized = JSON.stringify(data, (key, value) => {
            // Handle problematic values
            if (value === undefined) return null;
            if (typeof value === 'function') return '[Function]';
            if (value instanceof Date) return value.toISOString();
            return value;
        }, 2);

        logToFile(`[DEBUG] Response serialized successfully, length: ${serialized.length}`);
        return serialized;
    } catch (error: any) {
        logToFile(`[DEBUG] Data preparation error: ${error.message}`);
        return `[Data Preparation Error: ${error.message}]`;
    }
}

// Initialize connections
async function initializeConnections() {
    log(`[STARTUP] ===========================================`);
    log(`[STARTUP] CosmosDB MCP Server v${VERSION}`);
    log(`[STARTUP] PID: ${process.pid}`);
    log(`[STARTUP] ===========================================`);
    
    // Load connections from environment
    loadConnectionsFromEnv();
    
    const connectionIds = getRegisteredConnectionIds();
    log(`[STARTUP] Registered connections: ${connectionIds.join(', ') || 'none'}`);
    
    if (connectionIds.length === 0) {
        log(`[STARTUP] WARNING: No connections configured!`);
        log(`[STARTUP] Use COSMOS_CONNECTIONS env var (JSON array) to configure connections.`);
        log(`[STARTUP] Example: COSMOS_CONNECTIONS='[{"id":"main","connectionString":"...","databaseId":"mydb"}]'`);
        return;
    }
    
    // Connect all registered connections
    await connectAll();
    
    log(`[STARTUP] ===========================================`);
}

// Create the server with name and version
// @ts-ignore - Bypass TypeScript errors from the SDK's types
const server = new Server({
    name: "cosmosdb-mcp-server",
    version: VERSION
}, {
    capabilities: {
        tools: {}
    }
});

// Register the ListTools handler
// @ts-ignore - Bypass TypeScript errors from the SDK's types
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: MCP_COSMOSDB_TOOLS
}));

// Register the CallTool handler
// @ts-ignore - Bypass TypeScript errors from the SDK's types
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const input = request.params.arguments || {};

    logToFile(`[DEBUG] Tool called: ${toolName}, input: ${JSON.stringify(input)}`);

    try {
        let result;
        
        switch (toolName) {
            // Connection management
            case 'mcp_list_connections':
                result = await toolHandlers.mcp_list_connections();
                break;
            
            // Database and Container listing
            case 'mcp_list_databases':
                result = await toolHandlers.mcp_list_databases(input as any);
                break;
            case 'mcp_list_containers':
                result = await toolHandlers.mcp_list_containers(input as any);
                break;
            
            // Container information
            case 'mcp_get_container_definition':
                result = await toolHandlers.mcp_get_container_definition(input as any);
                break;
            case 'mcp_get_container_stats':
                result = await toolHandlers.mcp_get_container_stats(input as any);
                break;
            
            // Query and Read operations
            case 'mcp_cosmos_query':
                result = await toolHandlers.mcp_execute_query(input as any);
                break;
            case 'mcp_get_documents':
                result = await toolHandlers.mcp_get_documents(input as any);
                break;
            case 'mcp_get_document_by_id':
                result = await toolHandlers.mcp_get_document_by_id(input as any);
                break;
            case 'mcp_analyze_schema':
                result = await toolHandlers.mcp_analyze_schema(input as any);
                break;
            
            // CRUD operations
            case 'mcp_create_document':
                result = await toolHandlers.mcp_create_document(input as any);
                break;
            case 'mcp_update_document':
                result = await toolHandlers.mcp_update_document(input as any);
                break;
            case 'mcp_delete_document':
                result = await toolHandlers.mcp_delete_document(input as any);
                break;
            case 'mcp_upsert_document':
                result = await toolHandlers.mcp_upsert_document(input as any);
                break;
            
            default:
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: Tool '${toolName}' not found. Available tools: ${MCP_COSMOSDB_TOOLS.map(t => t.name).join(', ')}`
                        }
                    ],
                    isError: true
                };
        }

        logToFile(`[DEBUG] Tool: ${toolName}, Success: ${result.success}`);

        // Check if the handler result indicates an error
        if (!result.success) {
            logToFile(`[DEBUG] Handler error: ${result.error}`);
            const errorResponse = {
                content: [
                    {
                        type: "text",
                        text: `Error: ${result.error}`
                    }
                ],
                isError: true
            };
            logToFile(`[DEBUG] About to return error response for tool: ${toolName}`);
            return errorResponse;
        }

        // Safely prepare the data for response
        const serializedData = prepareDataForResponse(result.data);
        logToFile(`[DEBUG] Returning data length: ${serializedData.length}`);

        // Return successful result data only
        const response = {
            content: [
                {
                    type: "text",
                    text: `Tool: ${toolName}, Result: ${serializedData}`
                }
            ]
        };

        logToFile(`[DEBUG] About to return successful response for tool: ${toolName}`);

        // Log after response is sent
        setImmediate(() => {
            logToFile(`[DEBUG] Response sent successfully for tool: ${toolName}`);
        });

        return response;
    }
    catch (error: any) {
        logToFile(`[DEBUG] Catch block error: ${error.message}`);
        logToFile(`[DEBUG] Error stack: ${error.stack}`);
        const catchErrorResponse = {
            content: [
                {
                    type: "text",
                    text: `Error executing tool '${toolName}': ${error.message}`
                }
            ],
            isError: true
        };
        logToFile(`[DEBUG] About to return catch error response for tool: ${toolName}`);
        return catchErrorResponse;
    }
});

// Start the server using stdio transport
async function runServer() {
    // Initialize connections first
    await initializeConnections();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logToFile(`=== CosmosDB MCP Server STARTED (v${VERSION}) ===`);
    log(`CosmosDB MCP Server v${VERSION} running on stdio`);
}

runServer().catch((error) => {
    log(`Fatal error running server: ${error}`);
    process.exit(1);
});
