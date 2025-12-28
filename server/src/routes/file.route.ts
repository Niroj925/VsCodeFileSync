import { Router } from 'express';
import {
  createFile,
  createFolder,
  updateFile,
  deleteFile,
  searchFiles,
  getFileContent
} from '../controllers/file.controller';

const router = Router();

router.post('/create', createFile);
router.post('/create-folder', createFolder);
router.post('/update', updateFile);
router.post('/delete', deleteFile);
router.get('/search', searchFiles);
router.get('/content', getFileContent);
export default router;