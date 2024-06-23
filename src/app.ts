import express from 'express';
import "express-async-errors";
import cookieParser from 'cookie-parser';

import { apiRoutes } from './api/routes';
import { errorHandler } from './api/controllers/middleware/errorHandler';

const app = express();
app.use(cookieParser());

app.use(express.json());


app.use('/api', apiRoutes);

app.use(errorHandler);

export default app;
