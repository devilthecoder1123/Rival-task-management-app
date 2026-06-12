import { buildApp } from './app';
import { config } from './lib/config';
import { prisma } from './lib/prisma';

const app = buildApp();

const server = app.listen(config.PORT, () => {
  console.log(`🚀 API listening on http://localhost:${config.PORT}`);
  console.log(`📦 Environment: ${config.NODE_ENV}`);
});

const shutdown = async (signal: string) => {
  console.log(`\n${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
