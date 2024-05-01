import express, { Request, Response } from 'express';
import { User } from '../../db/models/User';
import { SignTokens } from '../../utils/jwt';
import { accessTokenCookieOptions, refreshTokenCookieOptions } from '../../utils/cookieOptions';

const authRoutes = express.Router();

authRoutes.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const exsistUser = await User.findOne({ where: { email }});

  if(exsistUser){
    throw new Error('User is already exsist');
  }

  const user = await User.create({ email, password })

  res.send(user);
});

authRoutes.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne( { where: { email }});

  if(!user || !(await User.comparePasswords(password, user.password))){
    throw new Error('Invalid email or password');
  }

  const { access_token, refresh_token } = await SignTokens(user);

  res.cookie('access_token', access_token, accessTokenCookieOptions)
  res.cookie('refresh_token', refresh_token, refreshTokenCookieOptions);

  res.send({success: 'success '})
});

export { authRoutes };
