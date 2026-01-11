import { Request, Response } from "express";
import embeddingService from "../services/embedding.service";

export const getServerChunk = async (req: Request, res: Response) => {
  try {
    const results = await embeddingService.getServerChunks();

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Search files error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const searchRelevantChunks = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const results = await embeddingService.searchRelevantChunks(
      query as string
    );

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Search files error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteCollection = async (req: Request, res: Response) => {
  try {
    const { collectionName } = req.query;
    if (!collectionName) {
      return false;
    }
    const results = await embeddingService.deleteCollection(
      collectionName as string
    );

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Search files error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const countPoints = async (req: Request, res: Response) => {
  try {
    const results = await embeddingService.countPoints();

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Search files error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
