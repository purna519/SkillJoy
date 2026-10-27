import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { RedisIoAdapter } from './chat/redis-io.adapter';
import helmet from 'helmet';

const logger = new Logger('Bootstrap');

// Standard fix for JSON serialization of BigInt fields from Prisma
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Helmet for global security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS — allow the Next.js frontend (and production domain)
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL ?? '',
    ].filter(Boolean),
    credentials: true,
  });

  // WebSocket Redis Adapter — with graceful fallback if Redis unavailable in dev
  try {
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
    logger.log('✅ Redis WebSocket adapter connected');
  } catch (err) {
    logger.warn(
      '⚠️  Redis unavailable — using in-memory WebSocket adapter (single-server only)',
    );
    // Falls back to default NestJS in-memory adapter; real-time still works for 1 server
  }

  // Global validation pipe — auto-strips unknown fields, auto-transforms types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global prefix for all REST routes: /api/...
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`🚀 SkillJoy API running on http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
