import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as express from 'express';
import { join } from 'path';

import connectRedis from 'connect-redis';
import Redis from 'ioredis'

import session from 'express-session';
import passport from 'passport';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { csrfSync } from 'csrf-sync';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true
  })

  app.setGlobalPrefix('secure/api', {
    exclude: ['csrf-token', ''],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );
  
  const RedisStore = connectRedis(session);
  const redisClient = new Redis({
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT!),
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      console.log(`[Redis] Retry attempt ${times}, delay: ${delay}ms`);
      return delay;
    },
    lazyConnect: true,
  });

  redisClient.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const sessionCookie = {
    maxAge: parseInt(process.env.EXPIRE_IN!),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/'
  };

  app.use(
    session({
      store: new RedisStore({ client: redisClient as any }),
      secret: process.env.TOKEN_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: sessionCookie
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  const { csrfSynchronisedProtection } = csrfSync({
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  });

  const publicPaths = [
    '/secure/api/user/login',
    '/secure/api/user/register',
    '/secure/api/user/resend-token',
    '/secure/api/user/forgot-password',
    '/secure/api/user/reset-password',
    '/secure/api/user/verify-token',
    '/secure/api/user/logout',
    '/secure/api/user/update-token-status',
  ];

  const csrfMiddleware = (req: any, res: any, next: any) => {
    csrfSynchronisedProtection(req, res, (err?: any) => {
      if (err && publicPaths.some(p => req.path.startsWith(p))) {
        return next();
      }
      next(err);
    });
  };

  app.use(csrfMiddleware);

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  await app.listen(parseInt(process.env.PORT!));
}
bootstrap();
