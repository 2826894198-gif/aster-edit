import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { statSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const compose = JSON.parse(execFileSync('docker', ['compose', 'config', '--format', 'json'], { cwd: root, encoding: 'utf8' }));

test('project, databases and volumes have dedicated names', () => {
  assert.equal(compose.name, 'aster-commerce-dev');
  assert.equal(compose.services.db.environment.MARIADB_DATABASE, 'aster_commerce_dev');
  assert.equal(compose.services.db.ports, undefined);
  for (const volume of Object.values(compose.volumes)) assert.ok(volume.name.startsWith('aster-commerce-dev_'));
});

test('only loopback web and mail UI ports are published', () => {
  for (const service of Object.values(compose.services)) {
    for (const port of service.ports ?? []) {
      assert.equal(port.host_ip, '127.0.0.1');
      assert.ok(['8088', '8028'].includes(port.published));
    }
  }
});

test('all code bind mounts stay in the independent backend checkout', () => {
  for (const service of Object.values(compose.services)) {
    for (const volume of service.volumes ?? []) {
      if (volume.type === 'bind') {
        assert.ok(volume.source.startsWith(root));
        assert.equal(volume.read_only, true);
        assert.ok(!volume.source.includes('盲盒独立站'));
      }
    }
  }
  assert.ok(statSync(new URL('../.git', import.meta.url)).isDirectory());
});

test('secrets are isolated and absent from version control', () => {
  assert.equal(statSync(new URL('../.secrets', import.meta.url)).mode & 0o777, 0o700);
  for (const file of ['db_password', 'db_root_password', 'admin_password']) {
    const secret = readFileSync(new URL(`../.secrets/${file}`, import.meta.url), 'utf8');
    // User-selected short administrator password is local-only; DB secrets remain strong.
    assert.ok(secret.length >= (file === 'admin_password' ? 8 : 32));
    assert.equal(execFileSync('git', ['check-ignore', `.secrets/${file}`], { cwd: root, encoding: 'utf8' }).trim(), `.secrets/${file}`);
  }
});

test('public health endpoint reveals only minimal service data', async () => {
  const response = await fetch('http://127.0.0.1:8088/wp-json/aster/v1/health');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('x-robots-tag'), /noindex/);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.deepEqual(await response.json(), {
    service: 'aster-commerce', contract_version: '1', woocommerce_loaded: true, environment: 'local',
  });
});

test('unauthenticated callers cannot enumerate admin customers or orders', async () => {
  for (const path of ['customers', 'orders']) {
    const response = await fetch(`http://127.0.0.1:8088/wp-json/wc/v3/${path}`);
    assert.ok([401, 403].includes(response.status));
    const body = await response.json();
    assert.equal(Array.isArray(body), false);
    assert.ok(body.code);
  }
});

test('local verification email actually arrived in Mailpit', async () => {
  const response = await fetch('http://127.0.0.1:8028/api/v1/messages');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.messages.some(message => message.Subject === 'ASTER LOCAL SMTP ISOLATION CHECK'));
});
