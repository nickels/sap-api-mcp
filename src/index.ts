#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

const BASE_URL = "https://api.sap.com";
const SEARCH_API = `${BASE_URL}/api/1.0/searchservice`;

interface SearchParams {
  searchterm: string;
  tab?: string;
  top?: number;
  skip?: number;
  product?: string;
  type?: string;
}

const server = new Server(
  {
    name: "sap-api-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_sap_content",
        description: "Search across all SAP API Business Hub content including APIs, CDS Views, Integration Packages, Business Processes, and more",
        inputSchema: {
          type: "object",
          properties: {
            searchterm: {
              type: "string",
              description: "Search query term",
            },
            tab: {
              type: "string",
              description: "Filter by content type: All, APIs, Packages, CDSViews, Events, Scenarios, Documents",
              enum: ["All", "APIs", "Packages", "CDSViews", "Events", "Scenarios", "Documents"],
              default: "All",
            },
            top: {
              type: "number",
              description: "Number of results to return (default: 12, max: 100)",
              default: 12,
            },
            skip: {
              type: "number",
              description: "Number of results to skip for pagination",
              default: 0,
            },
            product: {
              type: "string",
              description: "Filter by SAP product (e.g., 'SAP S/4HANA Cloud Public Edition', 'SAP S/4HANA')",
            },
            type: {
              type: "string",
              description: "Filter by content type (e.g., 'API', 'CDS View', 'Integration Package')",
            },
          },
          required: ["searchterm"],
        },
      },
      {
        name: "get_api_details",
        description: "Get detailed information about a specific API by its ID",
        inputSchema: {
          type: "object",
          properties: {
            api_id: {
              type: "string",
              description: "The ID of the API (e.g., 'CO_LEIDW_WAREHOUSE_SHIP_ORDER :: API')",
            },
          },
          required: ["api_id"],
        },
      },
      {
        name: "get_aggregations",
        description: "Get available filters/facets for SAP content (Products, Industries, Types, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            searchterm: {
              type: "string",
              description: "Optional search term to see aggregations for specific search results",
              default: "*",
            },
          },
        },
      },
      {
        name: "get_api_spec",
        description: "Get the OpenAPI/WSDL specification for an API",
        inputSchema: {
          type: "object",
          properties: {
            api_name: {
              type: "string",
              description: "The name of the API",
            },
            api_id: {
              type: "string",
              description: "The ID of the API package",
            },
          },
          required: ["api_name", "api_id"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (!args) {
      throw new Error("Missing arguments for tool call");
    }

    switch (name) {
      case "search_sap_content": {
        const results = await searchSAPContent(args as any);
        return {
          content: [
            {
              type: "text",
              text: formatSearchResults(results),
            },
          ],
        };
      }

      case "get_api_details": {
        const details = await getAPIDetails((args as any).api_id as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(details, null, 2),
            },
          ],
        };
      }

      case "get_aggregations": {
        const aggregations = await getAggregations((args as any).searchterm as string || "*");
        return {
          content: [
            {
              type: "text",
              text: formatAggregations(aggregations),
            },
          ],
        };
      }

      case "get_api_spec": {
        const spec = await getAPISpec((args as any).api_name as string, (args as any).api_id as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(spec, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Implementation functions
async function searchSAPContent(params: SearchParams) {
  const searchParams: any = {
    searchterm: params.searchterm,
    tab: params.tab || "All",
    $top: params.top || 12,
    $skip: params.skip || 0,
    $refinedBy: true,
  };

  // Add product filter if specified
  if (params.product) {
    searchParams.$filter = `Products eq '${params.product}'`;
  }

  const response = await axios.get(SEARCH_API, {
    params: searchParams,
    headers: {
      'Accept': 'application/json',
    },
  });

  return response.data;
}

async function getAPIDetails(apiId: string) {
  // Search for the specific API by ID
  const response = await axios.get(SEARCH_API, {
    params: {
      searchterm: apiId,
      tab: "APIs",
      $top: 1,
    },
    headers: {
      'Accept': 'application/json',
    },
  });

  const hits = response.data?.hits?.hits || [];
  if (hits.length === 0) {
    throw new Error(`API with ID ${apiId} not found`);
  }

  return hits[0]._source;
}

async function getAggregations(searchterm: string) {
  const response = await axios.get(SEARCH_API, {
    params: {
      searchterm,
      tab: "All",
      $top: 1,
      $refinedBy: true,
    },
    headers: {
      'Accept': 'application/json',
    },
  });

  return response.data?.aggregations || {};
}

async function getAPISpec(apiName: string, packageId: string) {
  // This would need to be refined based on actual API spec endpoint
  // The API Business Hub has endpoints like:
  // /api/{apiName}/specification
  const specUrl = `${BASE_URL}/api/${packageId}/${apiName}/specification`;

  try {
    const response = await axios.get(specUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(`Could not retrieve API specification: ${error.message}`);
  }
}

// Formatting helpers
function formatSearchResults(data: any): string {
  const hits = data?.hits?.hits || [];
  const total = data?.hits?.total || 0;

  let output = `# SAP API Business Hub Search Results\n\n`;
  output += `**Total Results:** ${total}\n`;
  output += `**Returned:** ${hits.length}\n\n`;

  hits.forEach((hit: any, index: number) => {
    const source = hit._source;
    output += `## ${index + 1}. ${source.DisplayName}\n\n`;
    output += `- **Type:** ${source.Type}${source.SubType ? ` (${source.SubType})` : ''}\n`;
    output += `- **ID:** \`${source.ID}\`\n`;

    if (source.Products) {
      output += `- **Products:** ${source.Products}\n`;
    }

    if (source.Description) {
      output += `- **Description:** ${source.Description}\n`;
    }

    if (source.Version) {
      output += `- **Version:** ${source.Version}\n`;
    }

    if (source.ServiceUrl) {
      output += `- **Service URL:** ${source.ServiceUrl}\n`;
    }

    if (source.APIState) {
      output += `- **State:** ${source.APIState}\n`;
    }

    if (source.AvgRating) {
      output += `- **Rating:** ${source.AvgRating}/5 (${source.RatingCount} reviews)\n`;
    }

    output += `\n`;
  });

  return output;
}

function formatAggregations(aggregations: any): string {
  let output = `# Available Filters\n\n`;

  for (const [key, agg] of Object.entries(aggregations)) {
    if (typeof agg === 'object' && agg !== null && 'buckets' in agg) {
      const buckets = (agg as any).buckets;
      output += `## ${key}\n\n`;

      buckets.slice(0, 10).forEach((bucket: any) => {
        output += `- ${bucket.key} (${bucket.doc_count})\n`;
      });

      if (buckets.length > 10) {
        output += `- ... and ${buckets.length - 10} more\n`;
      }

      output += `\n`;
    }
  }

  return output;
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SAP API MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
