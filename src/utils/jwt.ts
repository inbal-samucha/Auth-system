import fs from 'fs';
import path from 'path';
import jwt, { SignOptions } from 'jsonwebtoken';

import { User } from '../db/models/User';
import { getExpiresIn } from './cookieOptions';

const signJwt = (payload: Object, keyName: 'accessTokenPrivateKey' | 'refreshTokenPrivateKey' | 'resetTokenPrivateKey',  options: SignOptions) => {
  const keyPath = path.join(__dirname, 'keys', `${keyName}.pem`);
  const privateKey = fs.readFileSync(keyPath);

  const token = jwt.sign(payload, privateKey, {
    ...(options && options),
    algorithm: 'RS256'
  });

  return token;
}

export const SignTokens = async (user: User) => {

  const { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = await getExpiresIn();

  const access_token = signJwt({sub: user.id, role: user.role}, 'accessTokenPrivateKey', { expiresIn: `${ACCESS_TOKEN_EXPIRES_IN}m`});
  const refresh_token  = signJwt({sub: user.id, role: user.role}, 'refreshTokenPrivateKey', { expiresIn: `${REFRESH_TOKEN_EXPIRES_IN}m`});

  return { access_token, refresh_token };
}

export const SignResetToken = async (user: User) => {

  const { ACCESS_TOKEN_EXPIRES_IN } = await getExpiresIn();

  const reset_token = signJwt({sub: user.id, role: user.role}, 'resetTokenPrivateKey', { expiresIn: `${ACCESS_TOKEN_EXPIRES_IN}m`});
  
  return { reset_token };
}

export const verifyJwt = (token: string, keyName: 'accessTokenPublicKey' | 'refreshTokenPublicKey' | 'resetTokenPublicKey',  options?: SignOptions) => {
  const keyPath = path.join(__dirname, 'keys', `${keyName}.pem`);
  const publicKey = fs.readFileSync(keyPath);

  const decodedToken = jwt.verify(token, publicKey);

  return decodedToken;
}