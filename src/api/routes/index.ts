import express from 'express';
import { authRoutes } from './authRoutes';
import { metadataRoutes } from './metadataRoutes';

const apiRoutes = express.Router();

apiRoutes.use('/auth/users', authRoutes);
apiRoutes.use('/metadata', metadataRoutes);

export { apiRoutes };
