# SAP API Business Hub MCP Server

A Model Context Protocol (MCP) server that provides access to the SAP API Business Hub. This server allows AI assistants like Claude to search and discover SAP APIs, CDS Views, Integration Packages, and other SAP content.

## Features

- **Search SAP Content**: Search across APIs, Packages, CDS Views, Events, Scenarios, and Documents
- **Get API Details**: Retrieve detailed information about specific APIs
- **Browse Aggregations**: Explore available filters and categories
- **API Specifications**: Access OpenAPI/WSDL specifications for SAP APIs

## Installation

### Prerequisites

This package is published to GitHub Packages. You need to configure npm to use GitHub Packages for `@nickels` scoped packages.

Add the following to your global `~/.npmrc` file:

```
@nickels:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

**Important**: Replace `YOUR_GITHUB_TOKEN` with a GitHub Personal Access Token that has `read:packages` scope. Create one at https://github.com/settings/tokens

### Using npx (Recommended)

You can run this MCP server directly using npx without installing it globally:

```bash
npx @nickels/api-hub-mcp
```

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd sap-api-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run the server:
```bash
node build/index.js
```

## Configuration

### Claude Desktop

Add this server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sap-api-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["@nickels/api-hub-mcp"]
    }
  }
}
```

### Claude Code (CLI)

Add this server using the Claude Code CLI:

```bash
claude mcp add sap-api-mcp npx @nickels/api-hub-mcp
```

For local development, use:

```json
{
  "mcpServers": {
    "sap-api-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/sap-api-mcp/build/index.js"]
    }
  }
}
```

### Other MCP Clients

This server uses the standard MCP stdio transport and can be integrated with any MCP-compatible client.

## Available Tools

### search_sap_content

Search across all SAP API Business Hub content.

**Parameters:**
- `searchterm` (required): Search query term
- `tab` (optional): Filter by content type (All, APIs, Packages, CDSViews, Events, Scenarios, Documents)
- `top` (optional): Number of results to return (default: 12, max: 100)
- `skip` (optional): Number of results to skip for pagination
- `product` (optional): Filter by SAP product (e.g., "SAP S/4HANA Cloud Public Edition")
- `type` (optional): Filter by content type

**Example:**
```javascript
{
  "searchterm": "warehouse",
  "tab": "APIs",
  "product": "SAP S/4HANA Cloud Public Edition",
  "top": 20
}
```

### get_api_details

Get detailed information about a specific API by its ID.

**Parameters:**
- `api_id` (required): The ID of the API (e.g., "CO_LEIDW_WAREHOUSE_SHIP_ORDER :: API")

**Example:**
```javascript
{
  "api_id": "CO_LEIDW_WAREHOUSE_SHIP_ORDER :: API"
}
```

### get_aggregations

Get available filters/facets for SAP content (Products, Industries, Types, etc.).

**Parameters:**
- `searchterm` (optional): Search term to see aggregations for specific results (default: "*")

**Example:**
```javascript
{
  "searchterm": "material"
}
```

### get_api_spec

Get the OpenAPI/WSDL specification for an API.

**Parameters:**
- `api_name` (required): The name of the API
- `api_id` (required): The ID of the API package

**Example:**
```javascript
{
  "api_name": "WAREHOUSE_SHIP_ORDER",
  "api_id": "CO_LEIDW_WAREHOUSE_SHIP_ORDER"
}
```

## Use Cases

1. **API Discovery**: Find the right SAP API for your integration needs
2. **Documentation Access**: Get detailed information about API endpoints and specifications
3. **Product Exploration**: Browse APIs by SAP product (S/4HANA, BTP, etc.)
4. **CDS View Search**: Discover available CDS Views for data access
5. **Integration Planning**: Explore Integration Packages and Business Processes

## Example Usage with Claude

Once configured, you can ask Claude:

- "Search for warehouse-related APIs in SAP S/4HANA Cloud"
- "Get details about the warehouse shipment order API"
- "What SAP products have APIs available?"
- "Find CDS views related to material management"
- "Show me integration packages for SAP BTP"

## Development

### Watch Mode

Run TypeScript compilation in watch mode:

```bash
npm run watch
```

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

## API Information

This server interfaces with the SAP API Business Hub (api.sap.com). No authentication is required for basic search and discovery operations.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions:
- Create an issue in this repository
- Visit the SAP Community

## Related Projects

- [@ui5/mcp-server](https://www.npmjs.com/package/@ui5/mcp-server) - MCP server for UI5 documentation
- [@sap-ux/fiori-mcp-server](https://www.npmjs.com/package/@sap-ux/fiori-mcp-server) - MCP server for SAP Fiori tools
- [@cap-js/mcp-server](https://www.npmjs.com/package/@cap-js/mcp-server) - MCP server for SAP Cloud Application Programming Model
