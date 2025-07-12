import express from 'express';
import accountsRouter from './accounts.js';
import leadsRouter from './leads.js';
import campaignsRouter from './campaigns.js';
import categoriesRouter from './categories.js';
import templatesRouter from './templates.js';
import inboxRouter from './inbox.js';
import analyticsRouter from './analytics.js';
import warmupRouter from './warmup.js';

const router = express.Router();

router.use('/accounts', accountsRouter);
router.use('/leads', leadsRouter);
router.use('/campaigns', campaignsRouter);
router.use('/lead-categories', categoriesRouter);
router.use('/templates', templatesRouter);
router.use('/inbox', inboxRouter);
router.use('/analytics', analyticsRouter);
router.use('/warmup', warmupRouter);

export default router;