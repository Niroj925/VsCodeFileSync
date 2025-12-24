import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";

// Import controllers
import { sendChat } from "./controllers/chat.controller";
import {
  syncProject,
  getProjects,
  getProjectFiles,
} from "./controllers/project.controller";
import {
  createFile,
  createFolder,
  updateFile,
  deleteFile,
  searchFiles,
  getFileContent,
} from "./controllers/file.controller";

// Import socket setup
import { setupSocket } from "./socket";

// Load environment variables
dotenv.config();

// Constants
const PORT = process.env.PORT || 5001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// Initialize Express app
const app = express();

// Middleware
app.use(
  cors({
    //   origin: CORS_ORIGIN,
    origin: "*",
    //   credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// API Routes

// Chat routes
app.post("/api/chat/send", sendChat);

// Project routes
app.post("/api/project/sync", syncProject);
app.get("/api/projects", getProjects);
app.get("/api/project/:projectName/files", getProjectFiles);

// File operation routes
app.post("/api/file/create", createFile);
app.post("/api/file/create-folder", createFolder);
app.post("/api/file/update", updateFile);
app.post("/api/file/delete", deleteFile);

// Search and file content routes
app.get("/api/search", searchFiles);
app.get("/api/file", getFileContent);

// Simple health check
app.get("/test", (_req, res) => {
  res.json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "CodeBot Backend API",
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handler
app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
);

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io (from separate socket.ts file)
setupSocket(server);

// Start server
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`
    🚀 Server is running!
    🔗 HTTP: http://localhost:${PORT}
    📡 WebSocket: ws://localhost:${PORT}
    `);
  });
}

export default app;
