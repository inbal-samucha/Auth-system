import { NextFunction, Request, Response } from 'express';
import { verifyJwt } from '../../../utils/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../../../db/models/User';

//TODO: move it to external file
declare module "express" { 
  export interface Request {
    userId?: string
  }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try{
    const token = req.cookies.access_token;
    
    const decodedToken: string |JwtPayload = await verifyJwt(token, 'accessTokenPublicKey');
    
    if(!decodedToken){
      throw new Error('token is expired please login again');
    }
    
    req.userId = typeof decodedToken === 'string' ? decodedToken : decodedToken.sub;
  
    next();
  } catch(err){
    console.error('Error authenticating user:', err);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export const authorizeUser = (requiredRole: string) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.userId);

    if(!user){
      throw new Error('user is not found');
    }
    
    if (user.role !== requiredRole) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  } catch (error) {
    console.error('Error authorizing user:', error);
    res.status(500).json({ error: 'An error occurred while authorizing the user' });
  }
};