import { Request, Response } from 'express';
import fileService from '../services/file.service';

export const createFile = (req: Request, res: Response): void => {
  try {
    const { path, relativePath, content, size, lastModified } = req.body;

    if (!path || !relativePath || content === undefined) {
      res.status(400).json({ 
        success: false, 
        error: "Path, relativePath, and content are required" 
      });
      return;
    }

    fileService.createFile({ 
      path, 
      relativePath, 
      content, 
      size: size || 0, 
      lastModified: lastModified || new Date() 
    });

    res.json({ 
      success: true,
      message: "File created successfully"
    });
  } catch (error) {
    console.error("Create file error:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const createFolder = (req: Request, res: Response): void => {
  try {
    const { relativePath } = req.body;

    if (!relativePath) {
      res.status(400).json({ 
        success: false, 
        error: "Relative path is required" 
      });
      return;
    }

    fileService.createFolder(relativePath);

    res.json({ 
      success: true,
      message: "Folder created successfully"
    });
  } catch (error) {
    console.error("Create folder error:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const updateFile = (req: Request, res: Response): void => {
  try {
    const { path: filePath, content, size, lastModified } = req.body;

    if (!filePath || content === undefined) {
      res.status(400).json({ 
        success: false, 
        error: "Path and content are required" 
      });
      return;
    }

    fileService.updateFile({ 
      path: filePath, 
      content, 
      size: size || 0, 
      lastModified: lastModified || new Date() 
    });

    res.json({ 
      success: true,
      message: "File updated successfully"
    });
  } catch (error) {
    console.error("Update file error:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const keepChange = (req: Request, res: Response): void => {
  try {
    const { path: filePath, content } = req.body;

    if (!filePath || content === undefined) {
      res.status(400).json({ 
        success: false, 
        error: "Path and content are required" 
      });
      return;
    }

    fileService.keepChange({ 
      path: filePath, 
      content,
    });

    res.json({ 
      success: true,
      message: "changers updated successfully"
    });
  } catch (error) {
    console.error("Update file error:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const deleteFile = (req: Request, res: Response): void => {
  try {
    const { path: filePath } = req.body;

    if (!filePath) {
      res.status(400).json({ 
        success: false, 
        error: "Path is required" 
      });
      return;
    }

    fileService.deleteFile(filePath);

    res.json({ 
      success: true,
      message: "File deleted successfully"
    });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const getFileContent = (req: Request, res: Response): void => {
  try {
    const { project, filePath } = req.query;
    if (!project || !filePath) {
      res.status(400).json({ 
        success: false, 
        error: "Project and filePath are required" 
      });
      return;
    }

    const file = fileService.getFile(project as string, filePath as string);

    if (!file) {
      res.status(404).json({ 
        success: false,
        error: "File not found" 
      });
      return;
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
  } catch (error) {
    console.error("Get file content error:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const searchFiles = (req: Request, res: Response): void => {
  try {
    const { query, project } = req.query;

    if (!query) {
      res.status(400).json({ 
        success: false,
        error: "Search query is required" 
      });
      return;
    }

    const results = fileService.searchFiles(query as string, project as string);

    res.json({
      success: true,
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Search files error:", error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};