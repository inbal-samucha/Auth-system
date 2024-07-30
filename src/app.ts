import path from 'path';
import cors from 'cors';
import express from 'express';
import "express-async-errors";
import cookieParser from 'cookie-parser';
import { apiRoutes } from './api/routes';
import { errorHandler } from './api/controllers/middleware/errorHandler';

const app = express();
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Specify the directory where EJS templates are located
app.set('views', path.join(__dirname, 'views'));

const corsOptions = {
  origin: ['http://localhost:3001'],
  credentials: true
};
app.use(cors(corsOptions))

app.use('/api', apiRoutes);

app.use(errorHandler);

export default app;
