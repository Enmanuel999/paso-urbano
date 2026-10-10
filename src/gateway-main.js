import { createGateway } from './gateway.js';
const server = createGateway({ port: Number(process.env.GATEWAY_PORT || 3000) });
server.on('error', (error) => { console.error(`[gateway] ${error.message}`); process.exit(1); });
process.once('SIGINT', () => server.close(() => process.exit(0)));
process.once('SIGTERM', () => server.close(() => process.exit(0)));
