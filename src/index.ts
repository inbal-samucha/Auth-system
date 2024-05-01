import express from 'express';
import { apiRoutes } from './api/routes';
import cookieParser from 'cookie-parser';
import connection, { connectToDatabase } from './db/connection';

const port = process.env.PORT || 3000;

const app = express();
app.use(cookieParser());

app.use(express.json());

app.use('/api', apiRoutes);


app.listen(port, async () => {
  try {
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
