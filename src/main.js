import { spawn } from 'node:child_process';

const services = [
  ['catalogo', 'src/catalog-service/main.js'],
  ['pedidos', 'src/orders-service/main.js'],
  ['usuarios', 'src/users-service/main.js'],
  ['gateway-web', 'src/gateway-main.js'],
];
const children = [];
let stopping = false;
let exitCode = 0;

function shutdown(code = 0) {
  if (stopping) return;
  stopping = true; exitCode = code;
  for (const child of children) if (!child.killed) child.kill('SIGTERM');
  const timer = setTimeout(() => { for (const child of children) if (child.exitCode === null) child.kill('SIGKILL'); }, 5000);
  timer.unref();
}

for (const [name, script] of services) {
  const child = spawn(process.execPath, [script], { stdio: 'inherit', env: process.env });
  children.push(child);
  child.on('error', (error) => { console.error(`[${name}] No se pudo iniciar: ${error.message}`); shutdown(1); });
  child.on('exit', (code, signal) => {
    if (!stopping) {
      console.error(`[${name}] terminó inesperadamente (${signal || code}).`);
      shutdown(code || 1);
    }
  });
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
const waitForChildren = () => {
  if (stopping && children.every((child) => child.exitCode !== null || child.signalCode !== null)) process.exit(exitCode);
  setTimeout(waitForChildren, 100).unref();
};
for (const child of children) child.once('exit', waitForChildren);
console.log('Servicios iniciados como procesos independientes. Presiona Ctrl+C para detenerlos.');
