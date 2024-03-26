import express, { Request, Response } from 'express';
import { User } from '../../db/models/User';

const authRoutes = express.Router();

authRoutes.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const exsistUser = await User.findOne({ where: {email }});

  if(exsistUser){
    throw new Error('USer is already exsist');
  }

  const user = await User.create({ email, password })

  res.send(user);
});

export { authRoutes };
