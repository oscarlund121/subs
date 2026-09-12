// One-time setup: exchange an OAuth authorization code for a Gmail refresh token.
// Usage:
//   GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=... node scripts/get-gmail-token.mjs
import { google } from 'googleapis';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Missing GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET in the environment.');
  console.error('Run with: GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=... node scripts/get-gmail-token.mjs');
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost');

const url = oauth2.generateAuthUrl({
  access_type: 'offline', // -> refresh token
  prompt: 'consent', // force fresh consent so a refresh token is issued
  scope: ['https://www.googleapis.com/auth/gmail.readonly'],
});

console.log('\n1. Open this URL in your browser and sign in with your Google account:');
console.log('\n' + url + '\n');
console.log('2. Approve the read-only Gmail access.');
console.log('3. You will be redirected to a page that says it cannot be reached (localhost).');
console.log('   Copy the FULL URL from the address bar — it contains ?code=...');

const rl = readline.createInterface({ input, output });
const redirectUrl = await rl.question('\nPaste the full redirect URL here: ');
rl.close();

const code = new URL(redirectUrl).searchParams.get('code');
if (!code) {
  console.error('\nCould not find a "code" in that URL. Make sure you pasted the whole thing.');
  process.exit(1);
}

const { tokens } = await oauth2.getToken(code);
if (!tokens.refresh_token) {
  console.error('\nNo refresh token returned. If you approved before, Google may not re-issue one.');
  console.error('Revoke the app in your Google account, or re-run (the prompt=consent above should force a fresh one).');
  process.exit(1);
}

console.log('\nDone! Add this line to backend/.env:\n');
console.log('GMAIL_REFRESH_TOKEN=' + tokens.refresh_token + '\n');
