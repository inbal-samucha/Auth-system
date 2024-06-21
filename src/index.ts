import express from 'express';
import "express-async-errors";
import cookieParser from 'cookie-parser';

import { apiRoutes } from './api/routes';
import sendMail from './utils/EmailProvider';
import { connectToDatabase } from './db/connection';
import { errorHandler } from './api/controllers/middleware/errorHandler';


//TODO: split files to app.ts for express server configuration and index.ts to start the server https://medium.com/@xiaominghu19922/proper-error-handling-in-express-server-with-typescript-8cd4ffb67188
const port = process.env.PORT || 3000;

const app = express();
app.use(cookieParser());

app.use(express.json());


app.use('/api', apiRoutes);

app.use(errorHandler);

app.listen(port, async () => {
  try {
    // Use the sendEmail method
await sendMail('inbalsam2014@gmail.com', 'Welcome!', 'welcome', { userName: 'John Doe' });
    // Connect to the database
    await connectToDatabase();
    console.log('Connected to the database.');

    // Once connected, start listening to incoming requests
    console.log(`Server is running on port ${port}`);
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1); // Exit the process if database connection fails
  }
});
