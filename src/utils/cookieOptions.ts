import { CookieOptions } from "express";

const ACCESS_TOKEN_EXPIRES_IN = 1;
const REFRESH_TOKEN_EXPIRES_IN = 10;

const cookiesOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax'
};

if (process.env.NODE_ENV === 'production') cookiesOptions.secure = true;

export const accessTokenCookieOptions : CookieOptions = {
  ...cookiesOptions,
  expires: new Date(Date.now() + ACCESS_TOKEN_EXPIRES_IN * 60 * 1000)
}

export const refreshTokenCookieOptions : CookieOptions = {
  ...cookiesOptions,
  expires: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 60 * 1000)
}