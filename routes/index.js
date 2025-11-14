import express from 'express';
import resumeRoutes from './resume.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API!' });
});

router.use('/resume', resumeRoutes);

export default router;
