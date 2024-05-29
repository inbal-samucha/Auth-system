import express, { Request, Response } from 'express';

import { User } from '../../db/models/User';
import { SignTokens } from '../../utils/jwt';
import { Metadata } from '../../db/models/Metadata';
import { cookiesOptions } from '../../utils/cookieOptions';
import BadRequestError from '../../errors/BadRequestError';

const authRoutes = express.Router();

authRoutes.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if(!email || !password) {
    throw new BadRequestError({code: 400, message: "email and password is required!", logging: true});
  }

  const exsistUser = await User.findOne({ where: { email }});

  if(exsistUser){
    throw new BadRequestError({code: 400, message: "User is already exsist", logging: true});
  }

  const user = await User.create({ email, password })

  res.send(user);
});

authRoutes.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne( { where: { email }});

  if(!user || !(await User.comparePasswords(password, user.password))){
    throw new BadRequestError({code: 400, message: "Invalid email or password", logging: true});
  }


  const { access_token, refresh_token } = await SignTokens(user);


  //TODO: move token expires in logic to cookieOptions file
  const access_token_expires = await Metadata.findOne({ where: { key: 'access_token_expires_in'}});
  const refresh_token_expires = await Metadata.findOne({ where: { key: 'refresh_token_expires_in'}});

  const ACCESS_TOKEN_EXPIRES_IN = access_token_expires?.value;
  const REFRESH_TOKEN_EXPIRES_IN = refresh_token_expires?.value;
  

  if (ACCESS_TOKEN_EXPIRES_IN === undefined || REFRESH_TOKEN_EXPIRES_IN === undefined) {
    throw new BadRequestError({code: 400, message: "Could not fetch access or refresh token expiration time from the database", logging: true});
  }
  
  res.cookie('access_token', access_token, {
    ...cookiesOptions, 
    expires: new Date(Date.now() + parseInt(ACCESS_TOKEN_EXPIRES_IN) * 60 * 1000)
  })
  res.cookie('refresh_token', refresh_token, {
    ...cookiesOptions,
    expires: new Date(Date.now() + parseInt(REFRESH_TOKEN_EXPIRES_IN) * 60 * 1000)
  });
 
  res.send({success: 'success '})
});

export { authRoutes };
