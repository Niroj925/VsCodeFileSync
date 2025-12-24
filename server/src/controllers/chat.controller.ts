import { Request, Response } from 'express';
import { getAllFilesInFolder } from '../utils/helpers';
import { PROJECTS_BASE } from '../config/constants';
import path from 'path';
import fs from 'fs-extra';

export const sendChat = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Chat send request received");

    const { message = "", files = [] } = req.body;
    const flatFiles: Array<{ path: string; content: string }> = [];

    for (const item of files) {
      const fullPath = path.join(PROJECTS_BASE, item.path);

      try {
        // Handle folder
        if (item.type === "folder") {
          const folderFiles = await getAllFilesInFolder(fullPath, item.path);
          for (const file of folderFiles) {
            flatFiles.push({
              path: file.path,
              content: file.content,
            });
          }
        }

        // Handle single file
        if (item.type === "file") {
          const content = await fs.readFile(fullPath, "utf8");
          flatFiles.push({
            path: item.path,
            content,
          });
        }
      } catch (err) {
        console.error("Failed to read:", item.path, err instanceof Error ? err.message : 'Unknown error');
      }
    }

    res.json({
      success: true,
      data: { message, files: flatFiles },
    });
  } catch (err) {
    console.error("Chat send error:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};