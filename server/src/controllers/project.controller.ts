import { Request, Response } from 'express';
import fileService from '../services/file.service';

export const syncProject = (req: Request, res: Response): void => {
  try {
    const { projectName, files, srcFolder } = req.body;

    if (!projectName || !files || !srcFolder) {
      res.status(400).json({ 
        success: false, 
        error: "Project name, files, and srcFolder are required" 
      });
      return;
    }

    const project = fileService.syncProject(projectName, files, srcFolder);

    res.json({
      success: true,
      message: `Project ${projectName} synced successfully`,
      fileCount: files.length,
      frontendUrl: "http://localhost:3000",
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
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
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const getProjectFiles = (req: Request, res: Response): void => {
  try {
    const { projectName } = req.params;
    
    if (!projectName) {
      res.status(400).json({ 
        success: false, 
        error: "Project name is required" 
      });
      return;
    }

    const project = fileService.getProject(projectName);

    if (!project) {
      res.status(404).json({ 
        success: false,
        error: "Project not found" 
      });
      return;
    }

    res.json({
      success: true,
      project: projectName,
      files: project.files.map(file => ({
        path: file.path,
        size: file.size,
        lastModified: file.lastModified,
      })),
    });
  } catch (error) {
    console.error("Get project files error:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};