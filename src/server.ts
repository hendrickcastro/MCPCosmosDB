#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { connectCosmosDB } from './db.js';
import { MCP_COSMOSDB_TOOLS } from './tools.js';
import * as toolHandlers from './mcp-server.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup file logging
function logToFile(message: string, ...args: any[]) {
    const logFile = path.join(__dirname, '..', 'mcp_debug.log');
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message} ${args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' ')}\n`;

    try {
        fs.appendFileSync(logFile, logMessage);
        console.error(message, ...args); // Also log to console
    } catch (err) {
        console.error('Error writing to log file:', err);
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

// Create the server
const server = new Server(
    {
        name: "mcp-cosmosdb",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {}
        }
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    logToFile('[DEBUG] Listing tools');
    return {
        tools: MCP_COSMOSDB_TOOLS
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logToFile(`[DEBUG] Tool called: ${name} with args:`, args);

    try {
        let result;

        // Route to appropriate tool handler
        switch (name) {
            case "mcp_list_databases":
                result = await toolHandlers.mcp_list_databases();
                break;

            case "mcp_list_containers":
                result = await toolHandlers.mcp_list_containers();
                break;

            case "mcp_container_info":
                result = await toolHandlers.mcp_container_info(args as { container_id: string });
                break;

            case "mcp_container_stats":
                result = await toolHandlers.mcp_container_stats(args as { container_id: string; sample_size?: number });
                break;

            case "mcp_execute_query":
                result = await toolHandlers.mcp_execute_query(args as { 
                    container_id: string; 
                    query: string; 
                    parameters?: Record<string, any>;
                    max_items?: number;
                    enable_cross_partition?: boolean;
                });
                break;

            case "mcp_get_documents":
                result = await toolHandlers.mcp_get_documents(args as { 
                    container_id: string; 
                    limit?: number;
                    partition_key?: string;
                    filter_conditions?: Record<string, any>;
                });
                break;

            case "mcp_get_document_by_id":
                result = await toolHandlers.mcp_get_document_by_id(args as { 
                    container_id: string; 
                    document_id: string; 
                    partition_key: string; 
                });
                break;

            case "mcp_analyze_schema":
                result = await toolHandlers.mcp_analyze_schema(args as { 
                    container_id: string; 
                    sample_size?: number; 
                });
                break;

            default:
                throw new Error(`Unknown tool: ${name}`);
        }

        logToFile(`[DEBUG] Tool ${name} result:`, result);

        // Format the response
        if (result.success) {
            return {
                content: [
                    {
                        type: "text",
                        text: prepareDataForResponse(result.data)
                    }
                ]
            };
        } else {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${result.error}`
                    }
                ],
                isError: true
            };
        }

    } catch (error: any) {
        logToFile(`[ERROR] Tool execution failed for ${name}:`, error.message);
        return {
            content: [
                {
                    type: "text",
                    text: `Error executing tool ${name}: ${error.message}`
                }
            ],
            isError: true
        };
    }
});

// Initialize and start the server
async function main() {
    try {
        logToFile('[INFO] Starting CosmosDB MCP Server...');
        
        // Connect to CosmosDB
        await connectCosmosDB();
        logToFile('[INFO] Connected to CosmosDB successfully');

        // Create transport and connect
        const transport = new StdioServerTransport();
        await server.connect(transport);
        
        logToFile('[INFO] MCP CosmosDB Server started successfully');
    } catch (error: any) {
        logToFile('[ERROR] Failed to start server:', error.message);
        console.error('Failed to start MCP CosmosDB Server:', error);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    logToFile('[INFO] Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logToFile('[INFO] Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Run the server
main().catch((error) => {
    logToFile('[ERROR] Unhandled error in main:', error.message);
    console.error('Unhandled error:', error);
    process.exit(1);
}); 