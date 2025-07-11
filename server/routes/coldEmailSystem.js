import express from 'express';
import coldEmailSystemRouter from './coldEmailSystemIndex.js';

const router = express.Router();

router.use('/', coldEmailSystemRouter);

export default router;