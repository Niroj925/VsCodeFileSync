import { Request, Response } from "express";
import fileService from "../services/file.service";
import { saveApiKey } from "../utils/store-api-key";
import { saveCurrentModelProvider } from "../utils/store-current-model";
import { getCurrentModelProvider } from "../utils/get-current-model";
import { getModelsByProvider, saveModel } from "../utils/store-provider-models";
import llmConfig from "../config/llm-config";
import { extractChunksFromFiles } from "../utils/extract.chunks";
import { embedProjectChunks } from "../utils/embedding";
import { checkProjectExist } from "../utils/check-project-embed";
import { getSavedProject } from "../utils/get-project";
import { getIO } from "../socket";
import { addUpdateChunk } from "../utils/add-update-chunk";
import { EmbedUpdateChunk } from "../utils/embed-update-chunk";

export const syncProject = async (req: Request, res: Response) => {
  try {
    const { projectName, files, srcFolder } = req.body;
    if (!projectName || !files || !srcFolder) {
      res.status(400).json({
        success: false,
        error: "Project name, files, and srcFolder are required",
      });
      return;
    }
    const existingProject=getSavedProject();
    console.log('existing project:',existingProject)
    fileService.syncProject(projectName, files, srcFolder);
    const extractedChunk = await extractChunksFromFiles(
      files,
      srcFolder,
      projectName
    );
    const project = await checkProjectExist(projectName, srcFolder);

    if (project.exist) {
      console.log("this project already embeded");
     existingProject?.name==projectName? await addUpdateChunk(extractedChunk):await EmbedUpdateChunk(extractedChunk);
    } else {
      console.log("embedding method call");
      await embedProjectChunks();
    }

    const io = getIO();
    io.emit("projectEmbeded", {
      success: true,
      message: "Project synced and embedded.",
      projectName,
    });

    res.json({
      success: true,
      message: `Project ${projectName} synced successfully`,
      fileCount: files.length,
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const saveKey = (req: Request, res: Response) => {
  try {
    const { provider, apiKey } = req.body;
    if (!provider || !apiKey) {
      return res.status(400).json({
        success: false,
        error: "Provider and API key are required",
      });
    }

    saveApiKey(provider, apiKey);
    res.json({
      success: true,
      message: `API key for ${provider} saved successfully`,
    });
  } catch (error) {
    console.error("Save API key error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const saveProviderModels = (req: Request, res: Response) => {
  try {
    const { provider, models } = req.body;
    if (!provider || !models) {
      return res.status(400).json({
        success: false,
        error: "Provider and models are required",
      });
    }

    saveModel(provider, models);

    res.json({
      success: true,
      message: `Models for ${provider} saved successfully`,
    });
  } catch (error) {
    console.error("Save provider models error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getProviderModels = (req: Request, res: Response) => {
  try {
    const provider = req.query.provider as string;

    if (!provider) {
      return res.status(400).json({
        success: false,
        error: "Provider is required",
      });
    }

    const models = getModelsByProvider(provider);

    res.json({
      success: true,
      provider,
      models,
    });
  } catch (error) {
    console.error("Get provider models error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const saveCurrentModel = (req: Request, res: Response) => {
  try {
    const { provider, model } = req.body;
    console.log("provider, model:", provider, model);
    if (!provider || !model) {
      return res.status(400).json({
        success: false,
        error: "Provider and model are required",
      });
    }

    saveCurrentModelProvider(provider, model);
    llmConfig.reloadConfig();
    res.json({
      success: true,
      message: `Model provider for ${provider} saved successfully`,
    });
  } catch (error) {
    console.error("Save model error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getCurrentModel = (_req: Request, res: Response): void => {
  try {
    const currentModel = getCurrentModelProvider();

    res.json({
      success: true,
      model: currentModel,
    });
  } catch (error) {
    console.error("Get current model error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getProjects = (_req: Request, res: Response): void => {
  try {
    const projects = fileService.getAllProjects();

    res.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getSyncedProject = (_req: Request, res: Response): void => {
  try {
    const project = getSavedProject();

    res.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getProject = (_req: Request, res: Response): void => {
  try {
    const projectInfo = getSavedProject();
    if (!projectInfo?.name) return;
    const project = fileService.getProject(projectInfo?.name);

    res.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getProjectFiles = (req: Request, res: Response): void => {
  try {
    const { projectName } = req.params;

    if (!projectName) {
      res.status(400).json({
        success: false,
        error: "Project name is required",
      });
      return;
    }

    const project = fileService.getProject(projectName as string);

    if (!project) {
      res.status(404).json({
        success: false,
        error: "Project not found",
      });
      return;
    }

    res.json({
      success: true,
      project: projectName,
      files: project.files.map((file) => ({
        path: file.path,
        size: file.size,
        lastModified: file.lastModified,
      })),
    });
  } catch (error) {
    console.error("Get project files error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
