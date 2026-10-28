import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Download known public official packages on the host: some local DNS proxies
// return 198.18/15 inside Docker, which WordPress correctly rejects for safe HTTP.
// Do not disable WordPress safe URL validation to work around that environment.
const directory = new URL('../.runtime/packages/', import.meta.url);
mkdirSync(directory, { recursive: true });
const lock = JSON.parse(readFileSync(new URL('../versions.lock.json', import.meta.url), 'utf8'));
for (const { slug, version, url, sha256 } of lock.packages) {
  const filename = `${slug}.${version}.zip`;
  const path = fileURLToPath(new URL(filename, directory));
  if (!existsSync(path)) {
    if (url !== `https://downloads.wordpress.org/plugin/${filename}`) throw new Error('Unexpected package origin.');
    execFileSync('curl', ['--fail', '--silent', '--show-error', '--location', '--proto', '=https', '--proto-redir', '=https', '--max-time', '180', '--output', path, url], { stdio: 'inherit' });
  }
  const checksum = createHash('sha256').update(readFileSync(path)).digest('hex');
  if (checksum !== sha256) throw new Error(`Package checksum mismatch for ${filename}; installation stopped.`);
  console.log(`${filename} sha256=${checksum}`);
}
