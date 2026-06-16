// An agent Harness using MCP to list and read files for an entire project 

import { CONFIG } from './config.js'; 
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import express from "express";

const PROJECT_ROOT = CONFIG.PROJECT_ROOT;
const DASHBOARD_DATA_PATH = CONFIG.DASHBOARD_DATA_PATH;
const server = new McpServer({
  name: "code-insight-agent",
  version: "1.0.0",
});
const app = express();
app.use(express.json());

// data.json structure 
const DEFAULT_PROPS = {
  projectPath: "",
  files: [],
  activeFile: null,
  currentCode: "",
  proposedCode: "",
  lastUpdated: ""
};

// Utility Functions

/**
 * save latest property states for dashboard 
 * @param {object} data - full or partial DEFAULT_PROPS properties
 */
async function saveDashboardProps(data) {
  try {
    // ensures folder exists before write
    await fs.mkdir(path.dirname(DASHBOARD_DATA_PATH), { recursive: true });
    
    await fs.writeFile(DASHBOARD_DATA_PATH, JSON.stringify({ ...DEFAULT_PROPS, ...data }, null, 2));
  } catch (err) {
    console.error("Bridge Error:", err);
  }
}

/** 
 * list directory files for sidebar 
 * @param {string} dirPath - of chosen file
 * @returns {object} - metadata for directory files 
*/
async function listDirectory(dirPath) {
  const directory = path.join(PROJECT_ROOT, dirPath || "");
  const fileList = await fs.readdir(directory, { withFileTypes: true });

  return fileList.map(e => ({
    name: e.name,
    type: e.isDirectory() ? 'directory' : 'file',
    relativePath: dirPath ? `${dirPath}/${e.name}` : e.name 
  }));
}

/**
 * load file and it's directory siblings + agent proposed code into dashboard
 * @param {string} dirPath - of chosen file 
 * @param {string} [proposedCode=""] - code suggestion 
 */
async function updateDashboardUI(dirPath, proposedCode = "") {
  const file = dirPath.replace(/^\.?\/?/, ""); // remove slashes 
  const folder = path.dirname(file) === '.' ? '' : path.dirname(file);
  
  // load file and directory siblings
  const [code, fileList] = await Promise.all([
    fs.readFile(path.join(PROJECT_ROOT, file), "utf-8"),
    listDirectory(folder) 
  ]);

  await saveDashboardProps({
    files: fileList,
    activeFile: file,
    currentCode: code, 
    proposedCode: proposedCode
  });
}


// MCP Tools   

/**
 * Tool: list_files
 * Description: let AI see directory contents 
 */
server.tool(
  "list_files",
  "Explore the structure of the target project",
  { relative_path: z.string().default("") },
  async ({ relative_path }) => {
    try {
      const fileList = await listDirectory(relative_path);

      await saveDashboardProps({
        files: fileList,
      });

      // convert files into readable strings 
      const readableList = fileList.map(f => {
        if (f.type === 'directory') {
          return `[DIR] ${f.name}`;
        } else {
          return f.name;
        }
      }).join("\n");

      // send strings to AI 
      return { content: [{ type: "text", text: readableList || "(empty)" }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  }
);

/**
 * Tool: read_file
 * Description: let AI read directory contents 
 */
server.tool(
  "read_file",
  "Read code from the target project for analysis",
  { relative_path: z.string(),
    proposed_code: z.string().default("")
  },
  async ({ relative_path, proposed_code }) => {
    try {
      await updateDashboardUI(relative_path, proposed_code);
      
      // send contents to AI 
      return { content: [{ type: "text", text: `Successfully loaded context for ${relative_path}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  }
);

/**
 * Tool: write_file
 * Description: Overwrite contents of a file
 */
server.tool(
  "write_file",
  "Overwrite a file in the target project with new content",
  {
    relative_path: z.string(),
    content: z.string(),
  },
  async ({ relative_path, content }) => {
    try {
      const targetPath = path.resolve(PROJECT_ROOT, relative_path);
      
      if (!targetPath.startsWith(path.resolve(PROJECT_ROOT))) {
        throw new Error("Security Violation: Attempted to write outside of project root.");
      }

      // create backup for unchanged file 
      try {
        await fs.copyFile(targetPath, `${targetPath}.bak`);
      } catch (e) { /* ignore if file doesn't exist */ }

      await fs.writeFile(targetPath, content, "utf-8");
      
      await updateDashboardUI(relative_path, "");

      return { 
        content: [{ type: "text", text: `Successfully updated ${relative_path}` }] 
      };
    } catch (error) {
      return { 
        content: [{ type: "text", text: `Error: ${error.message}` }], 
        isError: true 
      };
    }
  }
);

// API Routes 

// click a file to read  
app.post("/api/select-file", async (req, res) => {
  const { relativePath } = req.body; 
  try {
    await updateDashboardUI(relativePath, ""); 
    res.json({ success: true });
  } catch (err) {
    console.error("CRASHED HERE:", err); // Force the error to print
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

    const fileList = await listDirectory(relativePath);

    await saveDashboardProps({
      files: fileList,
      activeFile: relativePath ? `${relativePath}/` : './', // handle root dir 
      lastUpdated: new Date().toLocaleTimeString()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// apply proposed changes from agent to file 
app.post("/api/apply-changes", async (req, res) => {
  const { relative_path, content } = req.body;
  try {
    const targetPath = path.resolve(PROJECT_ROOT, relative_path);
    
    if (!targetPath.startsWith(path.resolve(PROJECT_ROOT))) {
      return res.status(403).json({ error: "Access Denied" });
    }

    await fs.writeFile(targetPath, content, "utf-8");
    await updateDashboardUI(relative_path, ""); 
    
    res.json({ success: true });
  } catch (err) {
    console.error("Apply Changes Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// re-read file to always have latest state for data.json 
app.post("/api/refresh", async (req, res) => {
  const { relativePath } = req.body;
  try {
    await updateDashboardUI(relativePath, ""); 
    res.json({ success: true, message: "Dashboard synced with disk" });
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