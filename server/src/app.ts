import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import apiRoutes from "./routes";
import { setupSocket } from "./socket";

// Load environment variables
dotenv.config();

// Constants
const PORT = process.env.PORT || 5001;

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
app.use("/api", apiRoutes); 

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
