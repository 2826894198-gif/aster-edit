import { execFileSync } from 'node:child_process';
// The local preview may move when another project owns Vite's usual port.
export const storefrontOrigin = execFileSync('docker', ['compose','run','--rm','cli','eval','echo aster_local_storefront_origin();'], {encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d{1,5}$/.test(storefrontOrigin)) throw new Error('Expected a configured loopback storefront origin.');
