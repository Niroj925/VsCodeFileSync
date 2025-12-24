import { Router } from 'express';
import { syncProject, getProjects, getProjectFiles } from '../controllers/project.controller';

const router = Router();

router.post('/sync', syncProject);
router.get('/all', getProjects);
router.get('/:projectName/files', getProjectFiles);

export default router;