import { Router } from "express";
import {
    countPoints,
  deleteCollection,
  getServerChunk,
  searchRelevantChunks,
} from "../controllers/embedding.controller";

const router = Router();

router.get("/get-relevent-chunk", searchRelevantChunks);
router.get("/server-chunk", getServerChunk);
router.get("/count-points", countPoints);
router.delete("/delete-collection", deleteCollection);

export default router;
