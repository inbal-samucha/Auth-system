import fs from 'fs';
import path from 'path';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../db/models/User';
import { Metadata } from '../db/models/Metadata';

const signJwt = (payload: Object, keyName: 'accessTokenPrivateKey' | 'refreshTokenPrivateKey',  options: SignOptions) => {
  const keyPath = path.join(__dirname, 'keys', `${keyName}.pem`);
  const privateKey = fs.readFileSync(keyPath);

  const token = jwt.sign(payload, privateKey, {
    ...(options && options),
    algorithm: 'RS256'
  });

  return token;
}

export const SignTokens = async (user: User) => {

  const access_token_expires = await Metadata.findOne({ where: { key: 'access_token_expires_in'}});
  const refresh_token_expires = await Metadata.findOne({ where: { key: 'refresh_token_expires_in'}});

  const ACCESS_TOKEN_EXPIRES_IN = access_token_expires?.value;
  const REFRESH_TOKEN_EXPIRES_IN = refresh_token_expires?.value;

  const access_token = signJwt({sub: user.id}, 'accessTokenPrivateKey', { expiresIn: `${ACCESS_TOKEN_EXPIRES_IN}m`});
  const refresh_token  = signJwt({sub: user.id}, 'refreshTokenPrivateKey', { expiresIn: `${REFRESH_TOKEN_EXPIRES_IN}m`});

  return { access_token, refresh_token };
}

export const verifyJwt = (token: string, keyName: 'accessTokenPublicKey' | 'refreshTokenPublicKey',  options?: SignOptions) => {
  const keyPath = path.join(__dirname, 'keys', `${keyName}.pem`);
  const publicKey = fs.readFileSync(keyPath);

  const decodedToken = jwt.verify(token, publicKey);

  return decodedToken;
}