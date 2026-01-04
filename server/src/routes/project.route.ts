import { Router } from "express";
import {
  syncProject,
  extractedChunks,
  getProjects,
  getProjectFiles,
  saveKey,
  saveCurrentModel,
  getCurrentModel,
  saveProviderModels,
  getProviderModels,
} from "../controllers/project.controller";

const router = Router();

router.post("/sync", syncProject);
router.post("/ast", extractedChunks);
router.post("/save-key", saveKey);
router.post("/save-provider-models", saveProviderModels);
router.get("/get-provider-models", getProviderModels);
router.post("/save-model", saveCurrentModel);
router.get("/get-model", getCurrentModel);
router.get("/all", getProjects);
router.get("/:projectName/files", getProjectFiles);

export default router;