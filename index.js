// An agent Harness using MCP to list and read files for an entire project 

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import express from "express";

const PROJECT_ROOT = process.env.TARGET_PROJECT_PATH || process.cwd();
const server = new McpServer({
  name: "code-insight-agent",
  version: "1.0.0",
});
const app = express();
app.use(express.json());

// data.json structure 
const DEFAULT_STATE = {
  projectPath: "",
  files: [],
  activeFile: null,
  currentCode: "",
  proposedCode: "",
  lastUpdated: ""
};

// Utility Functions
// export agent findings to dashboard 
async function exportToDashboard(data) {
  const dashboardPath = '/Users/seanasuguitan/Projects/code-insight-agent/dashboard/public/data.json';
  try {
    await fs.writeFile(dashboardPath, JSON.stringify({ ...DEFAULT_STATE, ...data }, null, 2));
  } catch (err) {
    console.error("Bridge Error:", err);
  }
}

// format files in folder path for sidebar visual
async function fetchAndFormatDir(relativeFolderPath) {
  const absoluteFolderPath = path.join(PROJECT_ROOT, relativeFolderPath || "");
  const entries = await fs.readdir(absoluteFolderPath, { withFileTypes: true });

  return entries.map(e => ({
    name: e.name,
    type: e.isDirectory() ? 'directory' : 'file',
    relativePath: relativeFolderPath ? `${relativeFolderPath}/${e.name}` : e.name
  }));
}

// read chosen file + other files in same folder
async function handleFileRead(relative_path, proposed_code = "") {
  
  // chosen file 
  const cleanRelativePath = relative_path.replace(/^\.?\/+/, ""); // remove beginning slashes
  const chosenFilePath = path.join(PROJECT_ROOT, cleanRelativePath); 
  const content = await fs.readFile(chosenFilePath, "utf-8");

  // other files in chosen file folder 
  const currentFolder = path.dirname(cleanRelativePath); 
  const cleanFolderDir = currentFolder === '.' ? '' : currentFolder; // handle root path 
 
  // read and format files 
  const fileList = await fetchAndFormatDir(cleanFolderDir);

  await exportToDashboard({
    files: fileList,                   
    activeFile: cleanRelativePath,         
    currentCode: content,    
    proposedCode: proposed_code,   
    lastUpdated: new Date().toLocaleTimeString() 
  });
}

// MCP tools   
// list files in project 
server.tool(
  "list_files",
  "Explore the structure of the target project",
  { relative_path: z.string().default("") },
  async ({ relative_path }) => {
    try {
      // read and format files 
      const fileList = await fetchAndFormatDir(relative_path);

      // write project directory to data.json
      await exportToDashboard({
        files: fileList,
        lastUpdated: new Date().toLocaleTimeString() 
      });

      // raw names list 
      const list = fileList.map(f => f.type === 'directory' ? `[DIR] ${f.name}` : f.name).join("\n");
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
  { relative_path: z.string(),
    proposed_code: z.string().default("")
  },
  async ({ relative_path, proposed_code }) => {
    try {
      await handleFileRead(relative_path, proposed_code);
      return { content: [{ type: "text", text: `Successfully loaded context for ${relative_path}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  }
);

// API Routes 
// click a file to read  
app.post("/api/select-file", async (req, res) => {
  const { relativePath } = req.body; 
  try {
    await handleFileRead(relativePath, ""); 
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// click a folder to navigate to 
app.post("/api/select-dir", async (req, res) => {
  let { relativePath, goUp } = req.body;
  try {
    // go up a folder
    if (goUp && relativePath) {
      const parts = relativePath.split('/').filter(Boolean);
      parts.pop(); // drop current folder
      relativePath = parts.join('/'); // reassemble path
    }

    // read and format folder items 
    const fileList = await fetchAndFormatDir(relativePath);

    await exportToDashboard({
      files: fileList,
      activeFile: relativePath ? `${relativePath}/` : './', // handle root dir 
      lastUpdated: new Date().toLocaleTimeString()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5050, () => {
  console.error("Dashboard Bridge API listening on http://localhost:5050");
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(() => process.exit(1));