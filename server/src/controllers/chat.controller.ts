import { Request, Response } from "express";
import { getAllFilesInFolder } from "../utils/helpers";
import path from "path";
import fs from "fs-extra";
import { getStoredProjectDirectory } from "../utils/get-directory";
import llmService from "../services/llm.service";
import { getOpenaiKey } from "../utils/get-openai-key";

export const sendChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message = "", files = [], useLLM = true, options } = req.body;

    const projectDirectory = getStoredProjectDirectory();
    if (!projectDirectory) {
      res.status(400).json({
        success: false,
        error: "Project directory is not set",
      });
      return;
    }

    const flatFiles: Array<{
      path: string;
      content: string;
      type?: "file" | "folder" | "project";
    }> = [];

    for (const item of files) {
      const fullPath = path.join(projectDirectory, item.path);

      try {
        if (item.type === "folder") {
          const folderFiles = await getAllFilesInFolder(fullPath, item.path);
          for (const file of folderFiles) {
            flatFiles.push({
              path: file.path,
              content: file.content,
            });
          }
        }

        if (item.type === "file") {
          const content = await fs.readFile(fullPath, "utf8");
          flatFiles.push({
            path: item.path,
            content,
          });
        }
      } catch (err) {
        console.error(
          "Failed to read:",
          item.path,
          err instanceof Error ? err.message : "Unknown error"
        );
      }
    }

    if (useLLM && message.trim()) {
      try {
        const chatRequest = {
          query: message,
          files: flatFiles,
          options: options || {},
        };

        const llmResponse = await llmService.processChat(chatRequest);
        // console.log("LLM Response:", llmResponse);
        res.json(llmResponse);
      } catch (err) {
        console.error("LLM processing error:", err);
        res.json({
          success: false,
          error: {
            message: err instanceof Error ? err.message : "Unknown LLM error",
          },
        });
      }
    } else {
      res.json({
        success: true,
        data: { message, files: flatFiles },
      });
    }
  } catch (err) {
    console.error("Chat send error:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

export const sendQuery = async (req: Request, res: Response): Promise<void> => {
  const { query } = req.body;
  try {
    const { key } = getOpenaiKey();
    if (!key) {
      throw new Error("OpenAI API key missing for embeddings.");
    }
    const llmResponse = await llmService.processQuery(query);
    // console.log("LLM Response:", llmResponse);
    res.json(llmResponse);
  } catch (err) {
    console.error("LLM processing error:", err);
    res.json({
      success: false,
      error: {
        message: err instanceof Error ? err.message : "Unknown LLM error",
      },
    });
  }
};
