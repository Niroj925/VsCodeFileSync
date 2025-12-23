const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Store project data
let projects = {};
let fileIndex = {};

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// API Routes

// app.post("/api/chat/send", async (req, res) => {
//   try {
//     console.log("Chat send request received");
//     const { message, files } = req.body;
//     console.log('files:',files);

//     res.json({ success: true, files });
//   } catch (err) {
//     console.error("Chat send error:", err);
//     res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// });

const PROJECTS_BASE = '/Users/nirojthapa/Documents/myproject/cbot'; // Change this to your actual path

app.post("/api/chat/send", async (req, res) => {
  try {
    console.log("Chat send request received");
    const { message, files } = req.body;
    
    const allContents = [];
    
    for (const item of files) {
      const fullPath = path.join(PROJECTS_BASE, item.path);
      
      try {
        if (item.type === 'folder') {
          const folderFiles = await getAllFilesInFolder(fullPath, item.path);
          allContents.push({
            type: 'folder',
            path: item.path,
            files: folderFiles,
            count: folderFiles.length
          });
        } else {
          const content = await fs.readFile(fullPath, 'utf8');
          allContents.push({
            type: 'file',
            path: item.path,
            content: content
          });
        }
      } catch (err) {
        allContents.push({
          path: item.path,
          error: err.message
        });
      }
    }
    
    res.json({
      success: true,
      data: allContents
    });
    
  } catch (err) {
    console.error("Chat send error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

async function getAllFilesInFolder(folderPath, basePath = '') {
  const files = [];
  
  try {
    const items = await fs.readdir(folderPath);
    
    for (const item of items) {
      if (item === 'node_modules' || item.startsWith('.')) continue;
      
      const itemPath = path.join(folderPath, item);
      const relativePath = path.join(basePath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        const subFiles = await getAllFilesInFolder(itemPath, relativePath);
        files.push(...subFiles);
      } else {
        try {
          const content = await fs.readFile(itemPath, 'utf8');
          files.push({
            path: relativePath,
            content: content,
            size: content.length
          });
        } catch (e) {
          // Skip binary files
        }
      }
    }
  } catch (err) {
    console.error(`Error reading ${folderPath}:`, err);
  }
  
  return files;
}

// Sync project from VS Code
app.post("/api/project/sync", (req, res) => {
  try {
    const { projectName, files, srcFolder } = req.body;

    // Store project data
    projects[projectName] = {
      name: projectName,
      srcFolder: srcFolder,
      files: files,
      lastSynced: new Date(),
    };

    // Index files for search
    updateFileIndex(projectName, files);

    console.log(`Synced project: ${projectName} with ${files.length} files`);

    // Notify frontend via WebSocket
    io.emit("projectSynced", { projectName, fileCount: files.length });

    res.json({
      success: true,
      message: `Project ${projectName} synced successfully`,
      fileCount: files.length,
      frontendUrl: "http://localhost:3000",
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create file
app.post("/api/file/create", (req, res) => {
  const { path, relativePath, content, size, lastModified } = req.body;

  Object.values(projects).forEach((project) => {
    project.files.push({
      path: relativePath,
      fullPath: path,
      content,
      size,
      lastModified,
    });

    io.emit("fileCreated", {
      project: project.name,
      path: relativePath,
      content,
      size,
      lastModified,
    });
  });

  res.json({ success: true });
});

// Create folder
app.post("/api/file/create-folder", (req, res) => {
  const { relativePath } = req.body;

  Object.values(projects).forEach((project) => {
    project.folders.push(relativePath);

    io.emit("folderCreated", {
      project: project.name,
      path: relativePath,
    });
  });

  res.json({ success: true });
});

app.post("/api/file/update", (req, res) => {
  const { path: filePath, content, size, lastModified } = req.body;

  Object.values(projects).forEach((project) => {
    const file = project.files.find((f) => f.fullPath === filePath);
    if (file) {
      file.content = content;
      file.size = size;
      file.lastModified = lastModified;

      io.emit("fileUpdated", {
        project: project.name,
        path: file.path,
        content,
        size,
        lastModified,
      });
    }
  });

  res.json({ success: true });
});

app.post("/api/file/delete", (req, res) => {
  const { path: filePath } = req.body;

  Object.values(projects).forEach((project) => {
    project.files = project.files.filter((f) => f.fullPath !== filePath);

    io.emit("fileDeleted", {
      project: project.name,
      path: filePath,
    });
  });

  res.json({ success: true });
});

// Get all projects
app.get("/api/projects", (req, res) => {
  res.json({
    success: true,
    projects: Object.keys(projects).map((name) => ({
      name: name,
      fileCount: projects[name].files.length,
      lastSynced: projects[name].lastSynced,
    })),
  });
});

// Search files across all projects
app.get("/api/search", (req, res) => {
  const { query, project } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  const results = [];

  // Search in file index
  Object.keys(fileIndex).forEach((projectName) => {
    if (project && project !== projectName) return;

    fileIndex[projectName].forEach((file) => {
      const searchInContent = file.content
        .toLowerCase()
        .includes(query.toLowerCase());
      const searchInPath = file.path
        .toLowerCase()
        .includes(query.toLowerCase());

      if (searchInContent || searchInPath) {
        results.push({
          project: projectName,
          path: file.path,
          fullPath: file.fullPath,
          matchesInContent: searchInContent,
          matchesInPath: searchInPath,
          snippet: getSnippet(file.content, query),
          size: file.size,
        });
      }
    });
  });

  res.json({
    success: true,
    query: query,
    count: results.length,
    results: results,
  });
});

// Get specific file content
app.get("/api/file", (req, res) => {
  const { project, filePath } = req.query;

  if (!project || !filePath) {
    return res.status(400).json({ error: "Project and filePath are required" });
  }

  const projectData = projects[project];
  if (!projectData) {
    return res.status(404).json({ error: "Project not found" });
  }

  const file = projectData.files.find((f) => f.path === filePath);
  if (!file) {
    return res.status(404).json({ error: "File not found" });
  }

  res.json({
    success: true,
    file: {
      path: file.path,
      content: file.content,
      size: file.size,
      lastModified: file.lastModified,
    },
  });
});

// Get all files from a project's src folder
app.get("/api/project/:projectName/files", (req, res) => {
  const { projectName } = req.params;

  const projectData = projects[projectName];
  if (!projectData) {
    return res.status(404).json({ error: "Project not found" });
  }

  res.json({
    success: true,
    project: projectName,
    files: projectData.files.map((file) => ({
      path: file.path,
      size: file.size,
      lastModified: file.lastModified,
    })),
  });
});

// Helper function to update file index
function updateFileIndex(projectName, files) {
  fileIndex[projectName] = files.map((file) => ({
    path: file.path,
    fullPath: file.fullPath,
    content: file.content.toLowerCase(),
  }));
}

// Helper function to get text snippet around search query
function getSnippet(content, query, context = 100) {
  const index = content.toLowerCase().indexOf(query.toLowerCase());

  if (index === -1) return "";

  const start = Math.max(0, index - context);
  const end = Math.min(content.length, index + query.length + context);

  let snippet = content.substring(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";

  return snippet;
}

// WebSocket connection
io.on("connection", (socket) => {
  console.log("Frontend connected via WebSocket");

  socket.on("disconnect", () => {
    console.log("Frontend disconnected");
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
