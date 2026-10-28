// Verify the existing LOCAL administrator without printing passwords or auth cookies.
import { readFile, stat } from 'node:fs/promises';
const base = 'http://127.0.0.1:8088';
const username = 'asteredit';
const secret = new URL('../.secrets/admin_password', import.meta.url);
const mode = (await stat(secret)).mode & 0o777;
if (mode !== 0o600) throw new Error('Local admin secret must have mode 0600.');
const password = (await readFile(secret, 'utf8')).trim();
if (password.length < 8) throw new Error('Local admin secret is missing or too short.');
const jar = new Map();
function cookies(response) {
  for (const line of response.headers.getSetCookie()) {
    const pair = line.split(';')[0], split = pair.indexOf('=');
    jar.set(pair.slice(0, split), pair.slice(split + 1));
  }
}
const cookieHeader = () => [...jar].map(([key, value]) => `${key}=${value}`).join('; ');
const form = await fetch(`${base}/wp-login.php`, { redirect: 'manual' });
cookies(form);
const login = await fetch(`${base}/wp-login.php`, {
  method: 'POST', redirect: 'manual', headers: { Cookie: cookieHeader(), Origin: base, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ log: username, pwd: password, 'wp-submit': 'Log In', redirect_to: `${base}/wp-admin/admin.php?page=aster-orders`, testcookie: '1' }),
});
cookies(login);
if (login.status !== 302 || ![...jar.keys()].some(key => key.startsWith('wordpress_logged_in_'))) throw new Error('Stored credential did not authenticate. No password was changed.');
const page = await fetch(`${base}/wp-admin/admin.php?page=aster-orders`, { redirect: 'manual', headers: { Cookie: cookieHeader() } });
if (page.status !== 200 || !(await page.text()).includes('id="ops-detail"')) throw new Error('Authenticated workbench did not render.');
console.log(JSON.stringify({ administrator: username, login: `${base}/wp-admin/`, password_file_mode: '0600', native_login: 'verified', workbench_html: 'verified', browser_login: 'not_performed', password_changed: false }));
