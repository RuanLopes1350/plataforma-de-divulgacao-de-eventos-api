import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const {
  CLIENT_ID,
  CLIENT_SECRET,
  REFRESH_TOKEN,
  SENDER_EMAIL,
  APP_PASSWORD
} = process.env;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

export async function getTransport() {
  // const { token } = await oAuth2Client.getAccessToken();
  // return nodemailer.createTransport({
  //   service: 'gmail',
  //   auth: {
  //     type: 'OAuth2',
  //     user: SENDER_EMAIL,
  //     clientId: CLIENT_ID,
  //     clientSecret: CLIENT_SECRET,
  //     refreshToken: REFRESH_TOKEN,
  //     accessToken: token,
  //   },
  // });

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SENDER_EMAIL,
      pass: APP_PASSWORD,
    }
  });
}
