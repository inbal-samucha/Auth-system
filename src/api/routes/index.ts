import express from 'express';

import { authRoutes } from './authRoutes';
import { metadataRoutes } from './metadataRoutes';
import { authenticateUser, authorizeUser } from '../controllers/middleware/auth';

const apiRoutes = express.Router();

apiRoutes.use('/auth/users', authRoutes);
apiRoutes.use('/metadata', metadataRoutes);

apiRoutes.get('/restrict', authenticateUser, authorizeUser('user'), (req, res) => {
  console.log('goodddd');
  res.send({ success: 'success restrict'});
});

export { apiRoutes };
