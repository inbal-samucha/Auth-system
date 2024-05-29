import express, { Request, Response } from 'express';

import { Metadata } from '../../db/models/Metadata';

const metadataRoutes = express.Router();

metadataRoutes.post('/add', async (req: Request, res: Response) => {
  const { key, value } = req.body;

  const metadata = await Metadata.create({ key, value })

  res.send(metadata);
});


export { metadataRoutes };
