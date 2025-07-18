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

// Create the server with name and version
// @ts-ignore - Bypass TypeScript errors from the SDK's types
const server = new Server({
    name: "cosmosdb-proxy-server",
    version: "1.0.0"
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
    const input = request.params.arguments;
    const handler = (toolHandlers as { [key: string]: (args: any) => Promise<any> })[toolName];

    if (!handler) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: Tool '${toolName}' not found.`
                }
            ],
            isError: true
        };
    }

    try {
        await connectCosmosDB();
        let result;
        switch (toolName) {
            case 'mcp_list_databases':
                result = await toolHandlers.mcp_list_databases();
                break;
            case 'mcp_list_containers':
                result = await toolHandlers.mcp_list_containers();
                break;
            case 'mcp_container_info':
                result = await toolHandlers.mcp_container_info(input as any);
                break;
            case 'mcp_container_stats':
                result = await toolHandlers.mcp_container_stats(input as any);
                break;
            case 'mcp_execute_query':
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
            default:
                result = await handler(input);
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
                    text: serializedData
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
    // Don't close the connection after each call to allow multiple tool calls in the same session
    // The connection will be managed by the MCP's own lifecycle
});

// Start the server using stdio transport
// This is exactly how the working example does it
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logToFile("=== CosmosDB MCP Proxy STARTED ===");
    console.error("CosmosDB MCP Proxy running on stdio");
}

runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
}); 