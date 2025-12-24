
import { Router } from 'express';
import { sendChat } from '../controllers/chat.controller';

const router = Router();

router.post('/send', sendChat);

export default router;