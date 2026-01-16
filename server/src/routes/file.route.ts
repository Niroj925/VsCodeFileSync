import { Router } from "express";
import {
  createFile,
  createFolder,
  updateFile,
  deleteFile,
  searchFiles,
  getFileContent,
  keepChange,
} from "../controllers/file.controller";
import { getProjectFiles } from "../controllers/project.controller";

const router = Router();

router.post("/create", createFile);
router.post("/create-folder", createFolder);
router.post("/update", updateFile);
router.post("/delete", deleteFile);
router.get("/search", searchFiles);
router.get("/content", getFileContent);
router.post("/keep-change", keepChange);
router.get("/:projectName/files", getProjectFiles);


export default router;
