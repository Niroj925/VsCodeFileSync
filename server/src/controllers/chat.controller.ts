import { Request, Response } from "express";
import { getAllFilesInFolder } from "../utils/helpers";
import path from "path";
import fs from "fs-extra";
import { getStoredProjectDirectory } from "../utils/get-directory";
import llmService from "../services/llm.service";
import { PromptUtils } from "../utils/prompt.utils";

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

    // Collect file contents
    const flatFiles: Array<{ path: string; content: string; type?: 'file' | 'folder' | 'project' }> = [];

    for (const item of files) {
      const fullPath = path.join(projectDirectory, item.path);

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
            content
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

    // If useLLM is true, process with LLM
    if (useLLM && message.trim()) {
      try {
        const chatRequest = {
          query: message,
          files: flatFiles,
          options: options || {}
        };

        const llmResponse = await llmService.processChat(chatRequest);
        console.log("LLM Response:", llmResponse);
        // Send LLM response back to client
        res.json(llmResponse);
        
      } catch (llmError) {
        console.error("LLM processing error:", llmError);
        
        // Fallback to regular response if LLM fails
        res.json({
          success: true,
          data: { 
            message, 
            files: flatFiles,
            note: "LLM service unavailable, returning files only"
          },
        });
      }
    } else {
      // Regular response without LLM
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

/**
 * Get LLM provider information
 */
export const getLLMInfo = async (_req: Request, res: Response): Promise<void> => {
  try {
    const currentProvider = llmService.getCurrentProviderInfo();
    const availableProviders = llmService.getAvailableProviders();
    // const providerHealth = await llmService.getProviderHealth();
    
    res.json({
      success: true,
      currentProvider,
      availableProviders,
      // providerHealth,
      configSource: "data/llm-config.json"
    });
  } catch (error) {
    console.error("Get LLM info error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Test LLM provider
 */
export const testLLMProvider = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.body;
    
    if (!provider) {
      res.status(400).json({
        success: false,
        error: "Provider name is required"
      });
      return;
    }
    
    // const isWorking = await llmService.testProvider(provider);
    
    res.json({
      success: true,
      provider,
      // working: isWorking,
      // message: isWorking ? "Provider is working correctly" : "Provider test failed"
    });
  } catch (error) {
    console.error("Test LLM provider error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};