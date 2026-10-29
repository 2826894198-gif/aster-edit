import { mkdir, open, chmod } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const directory = new URL('../.secrets/', import.meta.url);
await mkdir(directory, { recursive: true, mode: 0o700 });
await chmod(directory, 0o700);
for (const name of ['db_password', 'db_root_password', 'admin_password']) {
  try {
    const file = await open(new URL(name, directory), 'wx', 0o600);
    try { await file.writeFile(randomBytes(32).toString('hex')); }
    finally { await file.close(); }
    console.log(`Created restricted credential file: ${name}`);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    console.log(`Kept existing credential file: ${name}`);
  }
}
console.log(`Local-only credentials: ${fileURLToPath(directory)} (contents are never printed).`);
