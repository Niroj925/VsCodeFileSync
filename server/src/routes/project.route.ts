import { Router } from "express";
import {
  syncProject,
  getProjects,
  getProjectFiles,
  saveKey,
  saveCurrentModel,
  getCurrentModel,
  saveProviderModels,
  getProviderModels,
  getSyncedProject,
  getProject,
} from "../controllers/project.controller";

const router = Router();

router.post("/sync", syncProject);
router.post("/save-key", saveKey);
router.post("/save-provider-models", saveProviderModels);
router.get("/get-provider-models", getProviderModels);
router.post("/save-model", saveCurrentModel);
router.get("/get-model", getCurrentModel);
router.get("/all", getProjects);
router.get("/unsaved", getProject);
router.get("/", getSyncedProject);
router.get("/:projectName/files", getProjectFiles);

export default router;
