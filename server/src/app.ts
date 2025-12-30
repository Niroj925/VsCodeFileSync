import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import apiRoutes from "./routes";
import { setupSocket } from "./socket";

dotenv.config();

const PORT = process.env.PORT || 5001;

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api", apiRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

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

const server = http.createServer(app);

setupSocket(server);

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
