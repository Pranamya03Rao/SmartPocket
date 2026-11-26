import * as webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vapidKeys = webpush.generateVAPIDKeys();

console.log('--- Generated VAPID Keys ---');
console.log('Public Key:\n', vapidKeys.publicKey);
console.log('Private Key:\n', vapidKeys.privateKey);
console.log('----------------------------');

const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  let updated = false;
  let newContent = envContent;

  const hasPublic = /^VAPID_PUBLIC_KEY=/m.test(envContent);
  const hasPrivate = /^VAPID_PRIVATE_KEY=/m.test(envContent);
  const hasSubject = /^VAPID_SUBJECT=/m.test(envContent);

  const linesToAdd = [];

  if (!hasPublic) {
    linesToAdd.push(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    updated = true;
  }
  if (!hasPrivate) {
    linesToAdd.push(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
    updated = true;
  }
  if (!hasSubject) {
    linesToAdd.push(`VAPID_SUBJECT=mailto:admin@smartpocket.org`);
    updated = true;
  }

  if (updated) {
    newContent = newContent.trimEnd() + '\n\n# Web Push VAPID Keys\n' + linesToAdd.join('\n') + '\n';
    fs.writeFileSync(envPath, newContent, 'utf8');
    console.log('Saved missing VAPID keys to server/.env');
  } else {
    console.log('VAPID keys already present in server/.env (not overwritten)');
  }
} else {
  console.log('server/.env not found, skipping writing to file.');
}
