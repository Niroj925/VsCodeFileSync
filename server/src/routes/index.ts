import { Router } from "express";
import chatRoutes from "./chat.route";
import projectRoutes from "./project.route";
import fileRoutes from "./file.route";
import embedingRoutes from "./embedding.route";

const router = Router();

router.use("/chat", chatRoutes);
router.use("/project", projectRoutes);
router.use("/file", fileRoutes);
router.use("/embedding", embedingRoutes);

router.get("/test", (_req, res) => {
  res.json({
    message: "CodeBot Backend API",
    version: "1.0.0",
    endpoints: {
      chat: "/api/chat",
      project: "/api/project",
      file: "/api/file",
      health: "/api/test",
    },
  });
});

export default router;
