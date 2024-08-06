import axios from "axios";
import qs from 'qs';

interface GoogleTokenResult {
  access_token: string;
  expires_in: Number;
  refresh_token: string;
  scope: string;
  id_token: string;
}

interface GoogleUserResult {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale:string;
}

export async function getGoogleOAuthTokens( code: string ): Promise<GoogleTokenResult>{
  const url = 'https://oauth2.googleapis.com/token';

  const values = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_OATH_REDIRECT_URL,
    grant_type: 'authorization_code'
  };

  try{
    const response = await axios.post<GoogleTokenResult>(url, qs.stringify(values), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    
    return response.data;

  }catch(err){
    console.log(err);
    //TODO: Add throe new error
    throw new Error('Failed to fetch Google OAuth tokens');
  }
}

export async function getGoogleUser( id_token: string , access_token: string ): Promise<GoogleUserResult>{
  try{
    const response = await axios.get<GoogleUserResult>(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`, {
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    });

    return response.data


  }catch(err){
    console.log(err);
    throw new Error('Error fetching Google user');
  }
}

