import path from 'path';
import { Op, where } from 'sequelize';
import { JwtPayload } from 'jsonwebtoken';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { User } from '../../db/models/User';

import Forbidden from '../../errors/Forbidden';
import sendMail from '../../utils/EmailProvider';
import Unauthorized from '../../errors/Unauthorized';
import { SignResetToken, SignTokens, verifyJwt } from '../../utils/jwt';
import BadRequestError from '../../errors/BadRequestError';
import { cookiesOptions } from '../../utils/cookieOptions';
import NotFound from '../../errors/NotFound';
import { getGoogleOAuthTokens, getGoogleUser } from '../../utils/oauthGoogle';



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

  res.send(user);
});



authRoutes.post('/login', async (req: Request, res: Response) => {
  const cookies = req.cookies;

  const { email, password } = req.body;

  const user = await User.findOne( { where: { email }});

  if(!user || !(await User.comparePasswords(password, user.password))){
    throw new BadRequestError({code: 400, message: "Invalid email or password", logging: true});
  }


  const { access_token, refresh_token } = await SignTokens(user);

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
  if(!cookies?.refresh_token){
    throw new Unauthorized({code: 401, message: "token is expired please login again", logging: true});
  }

  //save refresh token in variable and clear the cookie.refresh_token
  const refreshToken = cookies.refresh_token;
  res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'none', secure: true });

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
    return res.sendStatus(204);
  }

      // Delete refreshToken in db
    // foundUser.refreshToken = (foundUser.refreshToken || []).filter(rt => rt !== refreshToken); //TODO: check if i need this line or the next line
    foundUser.refreshToken = [];

    const result = await foundUser.save();

    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'none', secure: true });
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


authRoutes.get('/oauth/google', async ( req: Request, res: Response) => {
  //get the code from qs
  const code = req.query.code as string

  try{
    //get the id and access token with the code
    const response = await getGoogleOAuthTokens(code);
    const id_token = response.id_token;
    const google_access_token = response.access_token;
    console.log( {id_token, google_access_token});
    
    
    //get user with tokens
    const google_user = await getGoogleUser(id_token, google_access_token);
    console.log(google_user);

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

    //create access & refresh tokens
    const { access_token, refresh_token } = await SignTokens(user);
  
    //set cookies
    res.cookie('refresh_token', refresh_token, {
      ...cookiesOptions,
      maxAge: 24 * 60 * 60 * 1000 
    });

    res.send({ success: 'success',accessToken: access_token, role: user.role});
    
    //redirect back to client
  }catch(err){
    console.log(err);
    return res.redirect('http://localhost:3001') //TODO: check what redirect config.origin Google OAuth 2.0 With NodeJS (No Passport or googleapis) 35:30
  }

});


export { authRoutes };






