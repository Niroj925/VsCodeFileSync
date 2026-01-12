
import { Router } from 'express';
import { sendChat, sendQuery } from '../controllers/chat.controller';

const router = Router();

router.post('/send', sendChat);
router.post('/query', sendQuery);


export default router;