import fs from 'fs';
import path from 'path';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../db/models/User';

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

  const access_token = signJwt({sub: user.id}, 'accessTokenPrivateKey', { expiresIn: '1m'});
  const refresh_token  = signJwt({sub: user.id}, 'refreshTokenPrivateKey', { expiresIn: '1m'});

  return { access_token, refresh_token };
}