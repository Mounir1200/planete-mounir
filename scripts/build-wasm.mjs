import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = join(root, 'rust', 'planet-core', 'Cargo.toml');
const localCargo = join(homedir(), '.cargo', 'bin', process.platform === 'win32' ? 'cargo.exe' : 'cargo');
const cargo = process.env.CARGO || (existsSync(localCargo) ? localCargo : 'cargo');
const testing = process.argv.includes('--test');
const args = testing
  ? ['test', '--offline', '--manifest-path', manifest]
  : ['build', '--offline', '--release', '--target', 'wasm32-unknown-unknown', '--manifest-path', manifest];
const result = spawnSync(cargo, args, { cwd: root, stdio: 'inherit', windowsHide: true });
if (result.error || result.status !== 0) {
  console.error(result.error?.message || 'La compilation Rust a échoué.');
  console.error('Prérequis : Rust stable et la cible wasm32-unknown-unknown (rustup target add wasm32-unknown-unknown).');
  process.exit(result.status || 1);
}
if (!testing) {
  const binary = join(root, 'rust', 'planet-core', 'target', 'wasm32-unknown-unknown', 'release', 'planet_core.wasm');
  const destination = join(root, 'public', 'wasm', 'planet_core.wasm');
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(binary, destination);
  console.log(`Rust → WebAssembly : ${Math.round(statSync(destination).size / 1024)} Ko`);
}
