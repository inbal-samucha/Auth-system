import express from 'express';

import { authRoutes } from './authRoutes';
import { userRoutes } from './userRoutes';
import { metadataRoutes } from './metadataRoutes';
import { authenticateUser, authorizeUser } from '../controllers/middleware/auth';

const apiRoutes = express.Router();

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/metadata', metadataRoutes);
apiRoutes.use('/users', authenticateUser, authorizeUser('user'), userRoutes);

export { apiRoutes };
