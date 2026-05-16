// An agent Harness using MCP to list and read files for an entire project 

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

// export agent findings to dashboard 
async function exportToDashboard(data) {
  const dashboardPath = '/Users/seanasuguitan/Projects/code-insight-agent/dashboard/public/data.json';
  try {
    await fs.writeFile(dashboardPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Bridge Error:", err);
  }
}

// project agent evaluates  
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

      // format files for dashboard
      const fileList = entries.map(e => ({
        name: e.name,
        type: e.isDirectory() ? 'directory' : 'file'
      }));

      // write project directory to data.json
      await exportToDashboard({
        projectPath: PROJECT_ROOT,
        files: fileList,
        lastUpdated: new Date().toLocaleTimeString() 
      });

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
      const targetFilePath = path.join(PROJECT_ROOT, relative_path);
      const content = await fs.readFile(targetFilePath, "utf-8");

      // find folder containing file so sidebar focuses on it
      const currentFolder = path.dirname(targetFilePath);
      const entries = await fs.readdir(currentFolder, { withFileTypes: true });
      const fileList = entries.map(e => ({
        name: e.name,
        type: e.isDirectory() ? 'directory' : 'file'
      }));

      // write file content to data.json
      await exportToDashboard({
        projectPath: PROJECT_ROOT,
        files: fileList,                   
        activeFile: relative_path,         
        currentCode: content,       
        lastUpdated: new Date().toLocaleTimeString()
      });

      return { content: [{ type: "text", text: `Successfully loaded context for ${relative_path}` }] };
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