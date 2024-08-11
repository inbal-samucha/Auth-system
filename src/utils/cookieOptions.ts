import { CookieOptions } from "express";

import { Metadata } from "../db/models/Metadata";

export const cookiesOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};

// if (process.env.NODE_ENV === 'production') cookiesOptions.secure = true;


export const getExpiresIn = async() => {

    const access_token_expires = await Metadata.findOne({ where: { key: 'access_token_expires_in'}});
    const refresh_token_expires = await Metadata.findOne({ where: { key: 'refresh_token_expires_in'}});
    
    const ACCESS_TOKEN_EXPIRES_IN = access_token_expires?.value;
    const REFRESH_TOKEN_EXPIRES_IN = refresh_token_expires?.value;
    

    return { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN};
}

