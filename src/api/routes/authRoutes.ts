import express, { Request, Response } from 'express';
import { User } from '../../db/models/User';
import { SignTokens } from '../../utils/jwt';
// import { accessTokenCookieOptions, refreshTokenCookieOptions } from '../../utils/cookieOptions';
import { Metadata } from '../../db/models/Metadata';
import { cookiesOptions } from '../../utils/cookieOptions';

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


  //TODO: move token expires in logic to cookieOptions file
  const access_token_expires = await Metadata.findOne({ where: { key: 'access_token_expires_in'}});
  const refresh_token_expires = await Metadata.findOne({ where: { key: 'refresh_token_expires_in'}});

  const ACCESS_TOKEN_EXPIRES_IN = access_token_expires?.value;
  const REFRESH_TOKEN_EXPIRES_IN = refresh_token_expires?.value;
  

  if (ACCESS_TOKEN_EXPIRES_IN === undefined || REFRESH_TOKEN_EXPIRES_IN === undefined) {
    throw new Error('Could not fetch access or refresh token expiration time from the database');
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
