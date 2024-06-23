import { JwtPayload } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';

import { verifyJwt } from '../../../utils/jwt';
import { User } from '../../../db/models/User';
import BadRequestError from '../../../errors/BadRequestError';

//TODO: move it to external file
declare module "express" { 
  export interface Request {
    userId?: string;
    userRole?: string;
  }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try{
    const token = req.cookies.access_token;
    
    const decodedToken: string |JwtPayload = await verifyJwt(token, 'accessTokenPublicKey');
    
    if(!decodedToken){
      throw new BadRequestError({code: 400, message: "token is expired please login again", logging: true});
    }
    
    req.userId = typeof decodedToken === 'string' ? decodedToken : decodedToken.sub;
    req.userRole = typeof decodedToken === 'string' ? decodedToken : decodedToken.role;
  
    next();
  } catch(err){
    console.error('Error authenticating user:', err);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export const authorizeUser = (requiredRole: string) => async (req: Request, res: Response, next: NextFunction) => {
  try {

    if (req.userRole !== requiredRole) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  } catch (error) {
    console.error('Error authorizing user:', error);
    res.status(500).json({ error: 'An error occurred while authorizing the user' });
  }
};