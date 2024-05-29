import express, { Request, Response } from 'express';
import { User } from '../../db/models/User';
import { SignTokens } from '../../utils/jwt';

import { Metadata } from '../../db/models/Metadata';
import { cookiesOptions, getExpiresIn } from '../../utils/cookieOptions';


const authRoutes = express.Router();

authRoutes.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const exsistUser = await User.findOne({ where: { email }});

  if(exsistUser){
    throw new Error('User is already exsist');
  }

  const user = await User.create({ email, password });

  const { access_token, refresh_token } = await SignTokens(user);

  const { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = await getExpiresIn();

  res.cookie('access_token', access_token, {
    ...cookiesOptions, 
    expires: new Date(Date.now() + parseInt(ACCESS_TOKEN_EXPIRES_IN!) * 60 * 1000)
  })
  res.cookie('refresh_token', refresh_token, {
    ...cookiesOptions,
    expires: new Date(Date.now() + parseInt(REFRESH_TOKEN_EXPIRES_IN!) * 60 * 1000)
  });

  res.send(user);
});

authRoutes.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne( { where: { email }});

  if(!user || !(await User.comparePasswords(password, user.password))){
    throw new Error('Invalid email or password');
  }


  const { access_token, refresh_token } = await SignTokens(user);

  const { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = await getExpiresIn();
  
  res.cookie('access_token', access_token, {
    ...cookiesOptions, 
    expires: new Date(Date.now() + parseInt(ACCESS_TOKEN_EXPIRES_IN!) * 60 * 1000)
  })
  res.cookie('refresh_token', refresh_token, {
    ...cookiesOptions,
    expires: new Date(Date.now() + parseInt(REFRESH_TOKEN_EXPIRES_IN!) * 60 * 1000)
  });
 
  res.send({success: 'success '})
});

export { authRoutes };
