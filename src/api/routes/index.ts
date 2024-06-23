import express from 'express';

import { authRoutes } from './authRoutes';
import { metadataRoutes } from './metadataRoutes';
import { authenticateUser, authorizeUser } from '../controllers/middleware/auth';
import { userRoutes } from './userRoutes';

const apiRoutes = express.Router();

apiRoutes.use('/users', authenticateUser, authorizeUser('user'), userRoutes);
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/metadata', metadataRoutes);

export { apiRoutes };
