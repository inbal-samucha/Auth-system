import express from 'express';
import { authRoutes } from './authRoutes';

const apiRoutes = express.Router();

apiRoutes.use('/auth/users', authRoutes);

export { apiRoutes };
