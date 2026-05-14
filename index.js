// An agent Harness using MCP to list and read files for an entire project 

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

// project agent evalutes  
const PROJECT_ROOT = process.env.TARGET_PROJECT_PATH || process.cwd();

const server = new McpServer({
  name: "code-insight-agent",
  version: "1.0.0",
});

// list files in project 
server.tool(
  "list_files",
  "Explore the structure of the target project",
  { relative_path: z.string().default("") },
  async ({ relative_path }) => {
    try {
      const targetPath = path.join(PROJECT_ROOT, relative_path);
      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      const list = entries.map(e => e.isDirectory() ? `[DIR] ${e.name}` : e.name).join("\n");
      return { content: [{ type: "text", text: list || "(empty)" }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  }
);

// read files in project 
server.tool(
  "read_file",
  "Read code from the target project for analysis",
  { relative_path: z.string() },
  async ({ relative_path }) => {
    try {
      const content = await fs.readFile(path.join(PROJECT_ROOT, relative_path), "utf-8");
      return { content: [{ type: "text", text: content }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(() => process.exit(1));