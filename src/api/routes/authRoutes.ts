import path from 'path';
import { Op } from 'sequelize';
import { JwtPayload } from 'jsonwebtoken';
import express, { Request, Response } from 'express';

import { User } from '../../db/models/User';

import Forbidden from '../../errors/Forbidden';
import sendMail from '../../utils/EmailProvider';
import Unauthorized from '../../errors/Unauthorized';
import { SignResetToken, SignTokens, verifyJwt } from '../../utils/jwt';
import BadRequestError from '../../errors/BadRequestError';
import { cookiesOptions, getExpiresIn } from '../../utils/cookieOptions';
import NotFound from '../../errors/NotFound';

import qs from 'qs';
import axios from 'axios';
import { getGoogleOAuthTokens, getGoogleUser } from '../../utils/oAuthGoogle';


const authRoutes = express.Router();

authRoutes.post('/register', async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;
  console.log(req.body);
  
  if(!email || !password || !firstName || !lastName) {
    throw new BadRequestError({code: 400, message: "email, password, first name and last name is required!", logging: true});
  }

  const exsistUser = await User.findOne({ where: { email }});

  if(exsistUser){
    throw new BadRequestError({code: 400, message: "User is already exsist", logging: true});
  }

  const user = await User.create({ email, password, firstName, lastName });
  
  const attachments = [{
    filename: 'welcome.jpeg',
    path: path.join(__dirname, `../../views/assets/welcome.jpeg`),
    cid: 'welcomeImage'
  }]
  await sendMail(user.email, 'welcome', 'welcome', {userName: user.fullName, imageCid: 'welcomeImage'}, attachments)

  // const { access_token, refresh_token } = await SignTokens(user);

  // const { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = await getExpiresIn();

  // res.cookie('access_token', access_token, {
  //   ...cookiesOptions, 
  //   expires: new Date(Date.now() + parseInt(ACCESS_TOKEN_EXPIRES_IN!) * 60 * 1000)
  // })
  // res.cookie('refresh_token', refresh_token, {
  //   ...cookiesOptions,
  //   expires: new Date(Date.now() + parseInt(REFRESH_TOKEN_EXPIRES_IN!) * 60 * 1000)
  // });

  res.send(user);
});



authRoutes.post('/login', async (req: Request, res: Response) => {
  const cookies = req.cookies;

  console.log('cookies ', cookies)

  const { email, password } = req.body;

  console.log('email ', email)
  console.log('password ', password)


  const user = await User.findOne( { where: { email }});

  if(!user || !(await User.comparePasswords(password, user.password))){
    throw new BadRequestError({code: 400, message: "Invalid email or password", logging: true});
  }

  console.log('user ', user)

  const { access_token, refresh_token } = await SignTokens(user);

  // const { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = await getExpiresIn();

  // Initialize the new refresh token array
  let newRefreshTokenArray: string[] = [];

  if(user.refreshToken){
    if(cookies?.refresh_token){
      newRefreshTokenArray = user.refreshToken.filter(rt => rt !== cookies.refresh_token)
    }else{
      newRefreshTokenArray = user.refreshToken;
    }
  }


if (cookies?.refresh_token) {

  /* 
  Scenario added here: 
      1) User logs in but never uses RT and does not logout 
      2) RT is stolen
      3) If 1 & 2, reuse detection is needed to clear all RTs when user logs in
  */
  const refreshToken = cookies.refresh_token;
  const foundToken = await User.findOne({ where: { refreshToken: { [Op.contains]: [refreshToken]} }});

  // Detected refresh token reuse!
  if (!foundToken) {
      console.log('attempted refresh token reuse at login!')
      // clear out ALL previous refresh tokens
      newRefreshTokenArray = [];
  }

  res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'none', secure: true });
}

// Saving refreshToken with current user
user.refreshToken = [...newRefreshTokenArray, refresh_token];
const result = await user.save();


// Creates Secure Cookie with refresh token
  res.cookie('refresh_token', refresh_token, {
    ...cookiesOptions,
    maxAge: 24 * 60 * 60 * 1000 
  });
 
  res.send({success: 'success ', accessToken: access_token, role: user.role }) //TODO: change the role in model to array
});





authRoutes.get('/refresh_token', async (req: Request, res: Response) => {
  //if !cookie.refresh_token return 401 unauthorized
  const cookies = req.cookies;
  console.log('cookies in /refresh-token ', cookies);
  
  if(!cookies?.refresh_token){
    throw new Unauthorized({code: 401, message: "token is expired please login again", logging: true});
  }

  //save refresh token in variable and clear the cookie.refresh_token
  const refreshToken = cookies.refresh_token;
  res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'none', secure: true });
  res.clearCookie('access_token', { httpOnly: true, sameSite: 'none', secure: true });

  const foundUser = await User.findOne({ where: { refreshToken: { [Op.contains]: [refreshToken]} }});

  //detected refresh token reuse
  if(!foundUser){

    try{
      const decodedToken: string | JwtPayload = await verifyJwt(refreshToken, 'refreshTokenPublicKey');
      console.log('attempted refresh token reuse!');

      const hackedUser = await User.findByPk(Number((decodedToken as JwtPayload)?.sub));

      if (hackedUser) {
        hackedUser.refreshToken = [];
        const result = await hackedUser.save();
        console.log(result);
      }

    throw new Forbidden({code: 403, message: "Forbidden", logging: true});

    }catch (err){
      throw new Forbidden({code: 403, message: "Forbidden", logging: true});
    }

  }

  const newRefreshTokenArray = (foundUser.refreshToken || []).filter(rt => rt !== refreshToken);

  //evaluate jwt 
  //check if refresh token is valid, if it is create new refresh and access tokens

  try{
    const decodedToken: string | JwtPayload = await verifyJwt(refreshToken, 'refreshTokenPublicKey');

    if (foundUser.id !== Number((decodedToken as JwtPayload)?.sub)) return res.sendStatus(403);

    const { access_token, refresh_token } = await SignTokens(foundUser);

    // Saving refreshToken with current user
    foundUser.refreshToken = [...newRefreshTokenArray, refresh_token];
    await foundUser.save()

    // Creates Secure Cookie with refresh token
    res.cookie('access_token', access_token, { 
      ...cookiesOptions, 
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('refresh_token', refresh_token, {
      ...cookiesOptions,
      maxAge: 24 * 60 * 60 * 1000 
    });


    res.send({ accessToken:access_token, role: foundUser.role });

  } catch (err){
    console.log('expired refresh token')
    foundUser.refreshToken = [...newRefreshTokenArray];
    const result = await foundUser.save();
    console.log(result);

    throw new Forbidden({code: 403, message: "Forbidden", logging: true});
  }

});

authRoutes.get('/logout', async (req: Request, res: Response) => {
  const cookie = req.cookies;
  if(!cookie?.refresh_token) return res.sendStatus(204);

  const refreshToken = cookie.refresh_token;

  //Is refresh token in db?
  const foundUser = await User.findOne({ where: { refreshToken: { [Op.contains]: [refreshToken]} }});
  if(!foundUser){
    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'none', secure: true });
    // res.clearCookie('access_token', { httpOnly: true, sameSite: 'none', secure: true });
    return res.sendStatus(204);
  }

      // Delete refreshToken in db
    // foundUser.refreshToken = (foundUser.refreshToken || []).filter(rt => rt !== refreshToken); //TODO: check if i need this line or the next line
    foundUser.refreshToken = [];

    const result = await foundUser.save();
    console.log(result);

    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'none', secure: true });
    // res.clearCookie('access_token', { httpOnly: true, sameSite: 'none', secure: true });
    res.sendStatus(204);
});

authRoutes.post('/forgot-password', async ( req: Request, res: Response) => {
  const { email } = req.body;
  
  const user = await User.findOne({ where: { email }});
  if(!user){
    throw new NotFound( {code: 404, message: 'email not found', logging: true});
  }

  const { reset_token } = await SignResetToken(user);
  
  user.resetToken = reset_token;
  user.resetTokenExpiration = new Date(Date.now() + 3600000); //TODO fix the reset token expiration 
  await user.save();

  const resetUrl = `http://localhost:3000/api/auth/reset-password/${reset_token}`;

  await sendMail(user.email, 'reset password', 'resetPassword', { userName: user.fullName, resetUrl });

  res.send({ message: "a password reset link has been sent." });
});

authRoutes.get('/reset-password/:reset_token', async (req: Request, res: Response) => { //TODO: after i build the client side delete this route and handle the form in the client side
  const { reset_token } = req.params;
  res.render('check', { reset_token }); 
});

authRoutes.post('/reset-password/:reset_token', async ( req: Request, res: Response) => {
  const { reset_token } = req.params;
  const { newPassword } = req.body;

  console.log(newPassword);
  
  const decodedToken: string |JwtPayload = await verifyJwt(reset_token, 'resetTokenPublicKey');

  if(!decodedToken){
    throw new BadRequestError({code: 400, message: "token is expired please reset token again", logging: true});
  }

  const userId = typeof decodedToken === 'string' ? decodedToken : decodedToken.sub;
  const user = await User.findByPk(userId);
  if(!user){
    throw new NotFound({ code: 404, message: 'User not found', logging: true});
  }

  user.password = newPassword;
  user.resetToken = null;
  user.resetTokenExpiration = null;
  await user.save();

  res.send({ message: 'Password has been reset.'})
});



authRoutes.get('/oauth-google', async ( req: Request, res: Response) => {
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + qs.stringify({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(" "),
    access_type: 'offline',
    prompt: 'consent',
  });

  console.log("Redirect URI:", process.env.GOOGLE_OAUTH_REDIRECT_URL);

  res.redirect(authUrl);
});

authRoutes.get('/google/callback', async ( req: Request, res: Response) => {

  const code  = req.query.code as string;

  // Exchange code for tokens
  try {
    const response = await getGoogleOAuthTokens(code);
    const id_token = response.id_token;
    const google_access_token = response.access_token;

    //get user with tokens
    const google_user = await getGoogleUser(id_token, google_access_token);


    if(!google_user.verified_email){
      return res.status(403). send('Google account is not verified');
    }

      //upsert the user
      let user = await User.findOne({ where: { email: google_user.email}})
      if (!user) {
        const defaultPassword = '1234' //TODO: handle defualt password or remove the rquired password in model
        user = await User.create({
          email: google_user.email,
          password: defaultPassword
        });
    }

  const cookies = req.cookies;
    
     //create access & refresh tokens
     const { access_token, refresh_token } = await SignTokens(user);

     let newRefreshTokenArray: string[] = []; //TODO: extract this logic to extarnel logic with login routes too

     if(user.refreshToken){
       if(cookies?.refresh_token){
         newRefreshTokenArray = user.refreshToken.filter(rt => rt !== cookies.refresh_token)
       }else{
         newRefreshTokenArray = user.refreshToken;
       }
     }
   
   
   if (cookies?.refresh_token) {
   
     /* 
     Scenario added here: 
         1) User logs in but never uses RT and does not logout 
         2) RT is stolen
         3) If 1 & 2, reuse detection is needed to clear all RTs when user logs in
     */
     const refreshToken = cookies.refresh_token;
     const foundToken = await User.findOne({ where: { refreshToken: { [Op.contains]: [refreshToken]} }});
   
     // Detected refresh token reuse!
     if (!foundToken) {
         console.log('attempted refresh token reuse at login!')
         // clear out ALL previous refresh tokens
         newRefreshTokenArray = [];
     }
   
     res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'none', secure: true });
   }
   
   // Saving refreshToken with current user
   user.refreshToken = [...newRefreshTokenArray, refresh_token];
  await user.save();

     //set cookies
     res.cookie('refresh_token', refresh_token, {
       ...cookiesOptions,
       maxAge: 24 * 60 * 60 * 1000 
     });
 

    res.send({success: 'success ', accessToken: access_token, role: user.role }) //TODO: change the role in model to array

  } catch (error) {
    console.error('Error during Google OAuth process:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

export { authRoutes };






